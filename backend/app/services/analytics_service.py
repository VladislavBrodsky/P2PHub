import logging
from datetime import datetime, timedelta

from app.core.config import settings
from app.models.partner import Partner
from sqlmodel import text
from sqlmodel.ext.asyncio.session import AsyncSession

logger = logging.getLogger(__name__)

async def get_referral_tree_stats(session: AsyncSession, partner_id: int) -> dict[str, int]:
    """
    Uses Materialized Path for ultra-fast 9-level tree counting.
    """
    import sentry_sdk
    with sentry_sdk.start_span(op="db.query", description="get_referral_tree_stats"):
        partner = await session.get(Partner, partner_id)
        if not partner: return {f"level_{i}": 0 for i in range(1, 10)}

        search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
        base_depth = len(search_path.split('.'))

        query = text("""
            SELECT depth - :base_depth + 1 as level, COUNT(*) as count
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            AND depth BETWEEN :base_depth AND :base_depth + 8
            GROUP BY 1
            ORDER BY level;
        """)

        result = await session.execute(query, {
            "search_path": search_path,
            "search_wildcard": f"{search_path}.%",
            "base_depth": base_depth
        })

        stats = {str(i): 0 for i in range(1, 10)}
        rows = result.all()
        for row in rows:
            lvl = int(row[0])
            if 1 <= lvl <= 9:
                stats[str(lvl)] = row[1]

        return stats

async def get_referral_tree_members(session: AsyncSession, partner_id: int, target_level: int) -> list[dict]:
    """
    Fetches details of partners at a specific level using Materialized Path.
    """
    import sentry_sdk
    with sentry_sdk.start_span(op="db.query", description="get_referral_tree_members"):
        if not (1 <= target_level <= 9):
            return []

        partner = await session.get(Partner, partner_id)
        if not partner: return []

        search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
        base_depth = len(search_path.split('.'))
        target_depth = base_depth + target_level - 1

        query = text("""
            SELECT telegram_id, username, first_name, last_name, xp, photo_url, created_at,
                   balance, level as partner_level, referral_code, is_pro, updated_at, id, photo_file_id
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            AND depth = :target_depth
            ORDER BY xp DESC
            LIMIT 100;
        """)

        try:
            result = await session.execute(query, {
                "search_path": search_path,
                "search_wildcard": f"{search_path}.%",
                "target_depth": target_depth
            })
            members = [
                {
                    "telegram_id": row[0], "username": row[1], "first_name": row[2],
                    "last_name": row[3], "xp": row[4], "photo_url": row[5],
                    "created_at": row[6].isoformat() if row[6] else None,
                    "balance": row[7], "level": row[8], "referral_code": row[9],
                    "is_pro": bool(row[10]),
                    "updated_at": row[11].isoformat() if row[11] else None,
                    "id": row[12], "photo_file_id": row[13]
                }
                for row in rows
            ]
            return members
        except Exception as e:
            logger.error(f"Error fetching tree members: {e}")
            return []

async def get_network_growth_metrics(session: AsyncSession, partner_id: int, timeframe: str = '7D') -> dict:
    """
    Calculates partners joined in the current period vs the previous period using Materialized Path.
    """
    partner = await session.get(Partner, partner_id)
    if not partner: return {"growth_pct": 0, "previous_count": 0, "current_count": 0}

    now = datetime.utcnow()
    if timeframe == '24H': delta = timedelta(hours=24)
    elif timeframe == '7D': delta = timedelta(days=7)
    elif timeframe == '1M': delta = timedelta(days=30)
    else: delta = timedelta(days=7)

    current_start = now - delta
    previous_start = now - (delta * 2)

    search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")

    stmt_curr = text("""
        SELECT COUNT(*) FROM partner
        WHERE (path = :search_path OR path LIKE :search_wildcard)
        AND created_at >= :start AND created_at <= :end
    """)
    res_curr = await session.execute(stmt_curr, {
        "search_path": search_path,
        "search_wildcard": f"{search_path}.%",
        "start": current_start,
        "end": now
    })
    current_count = res_curr.scalar() or 0

    stmt_prev = text("""
        SELECT COUNT(*) FROM partner
        WHERE (path = :search_path OR path LIKE :search_wildcard)
        AND created_at >= :start AND created_at < :end
    """)
    res_prev = await session.execute(stmt_prev, {
        "search_path": search_path,
        "search_wildcard": f"{search_path}.%",
        "start": previous_start,
        "end": current_start
    })
    previous_count = res_prev.scalar() or 0

    if previous_count == 0:
        growth_pct = 100.0 if current_count > 0 else 0.0
    else:
        growth_pct = ((current_count - previous_count) / previous_count) * 100.0

    return {
        "growth_pct": round(growth_pct, 1),
        "current_count": current_count,
        "previous_count": previous_count,
        "timeframe": timeframe
    }

async def get_network_time_series(session: AsyncSession, partner_id: int, timeframe: str = '7D') -> list[dict]:
    """
    Returns data points for a growth chart using Materialized Path.
    Optimized for high-concurrency and large networks.
    """
    partner = await session.get(Partner, partner_id)
    if not partner: return []

    now = datetime.utcnow()
    now = datetime.utcnow()
    tf_config = {
        '24H': ('hour', now - timedelta(hours=24), 24),
        '7D':  ('day',  now - timedelta(days=7),   7),
        '1M':  ('day',  now - timedelta(days=30),  30),
        '3M':  ('day',  now - timedelta(days=90),  9),
        '6M':  ('month',now - timedelta(days=180), 6),
        '1Y':  ('month',now - timedelta(days=365), 12)
    }
    interval, start_time, points = tf_config.get(timeframe, tf_config['7D'])

    search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
    base_depth = len(search_path.split('.'))

    # 1. Fetch buckatized counts for the timeframe
    data_map = await _fetch_time_series_buckets(session, search_path, base_depth, interval, start_time)

    # 2. Fetch Base Totals (Cumulative count before timeframe)
    running_totals = await _fetch_base_cumulative_totals(session, search_path, base_depth, start_time)

    # 3. Assemble Output Data Points
    return _assemble_time_series_response(start_time, points, interval, data_map, running_totals)

async def _fetch_time_series_buckets(session, path: str, base_depth: int, interval: str, start: datetime) -> dict:
    bucket_column = _get_bucket_expr(interval)
    query = text(f"""
        SELECT {bucket_column} as bucket, depth - :base_depth + 1 as level, COUNT(*) as count
        FROM partner WHERE (path = :path OR path LIKE :wildcard) AND created_at >= :start
        AND (depth - :base_depth + 1) BETWEEN 1 AND 9 GROUP BY 1, 2 ORDER BY 1 ASC;
    """)
    result = await session.execute(query, {"path": path, "wildcard": f"{path}.%", "start": start, "base_depth": base_depth})
    
    data_map = {}
    for row in result.all():
        b = row[0]
        if isinstance(b, str): b = datetime.strptime(b, '%Y-%m-%d %H:%M:%S')
        b = b.replace(tzinfo=None)
        if b not in data_map: data_map[b] = {lvl: 0 for lvl in range(1, 10)}
        data_map[b][int(row[1])] = int(row[2])
    return data_map

async def _fetch_base_cumulative_totals(session, path: str, base_depth: int, start: datetime) -> dict[int, int]:
    stmt = text("""
        SELECT depth - :base_depth + 1 as level, COUNT(*)
        FROM partner WHERE (path = :path OR path LIKE :wildcard) AND created_at < :start
        AND (depth - :base_depth + 1) BETWEEN 1 AND 9 GROUP BY 1
    """)
    res = await session.execute(stmt, {"path": path, "wildcard": f"{path}.%", "start": start, "base_depth": base_depth})
    totals = {lvl: 0 for lvl in range(1, 10)}
    for row in res.all():
        totals[int(row[0])] = int(row[1])
    return totals

def _get_bucket_expr(interval: str) -> str:
    if "sqlite" in settings.DATABASE_URL:
        return {'hour': "strftime('%Y-%m-%d %H:00:00', created_at)", 'day': "strftime('%Y-%m-%d 00:00:00', created_at)", 'month': "strftime('%Y-%m-01 00:00:00', created_at)"}.get(interval)
    return f"date_trunc('{interval}', created_at)"

def _assemble_time_series_response(start: datetime, points: int, interval: str, data_map: dict, totals: dict) -> list[dict]:
    data = []
    curr = start
    for _ in range(points + 1):
        next_curr, label, bucket_key = _get_next_time_step(curr, interval)
        b_data = data_map.get(bucket_key, {lvl: 0 for lvl in range(1, 10)})
        for lvl in range(1, 10): totals[lvl] += b_data[lvl]
        data.append({"date": label, "total": sum(totals.values()), "levels": [totals[lvl] for lvl in range(1, 10)], "joined_per_level": [b_data[lvl] for lvl in range(1, 10)]})
        curr = next_curr
    return data

def _get_next_time_step(c: datetime, interval: str) -> tuple[datetime, str, datetime]:
    if interval == 'hour': 
        return c + timedelta(hours=1), f"{c.hour:02d}:00", c.replace(minute=0, second=0, microsecond=0)
    if interval == 'day': 
        return c + timedelta(days=1), f"{c.day:02d}/{c.month:02d}", c.replace(hour=0, minute=0, second=0, microsecond=0)
    next_month = c.month % 12 + 1
    nb = c.replace(year=c.year + (1 if c.month == 12 else 0), month=next_month, day=1, hour=0, minute=0, second=0, microsecond=0)
    return nb, c.strftime("%b"), c.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
