import logging
from datetime import datetime, timedelta
from typing import List

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import Partner

logger = logging.getLogger(__name__)

async def get_referral_tree_stats(session: AsyncSession, partner_id: int) -> dict[str, int]:
    """
    Uses Materialized Path for ultra-fast 9-level tree counting.
    """
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

async def get_referral_tree_members(session: AsyncSession, partner_id: int, target_level: int) -> List[dict]:
    """
    Fetches details of partners at a specific level using Materialized Path.
    """
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
        members = []
        rows = result.all()
        for row in rows:
            members.append({
                "telegram_id": row[0],
                "username": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "xp": row[4],
                "photo_url": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "balance": row[7],
                "level": row[8],
                "referral_code": row[9],
                "is_pro": bool(row[10]),
                "updated_at": row[11].isoformat() if row[11] else None,
                "id": row[12],
                "photo_file_id": row[13]
            })

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

async def get_network_time_series(session: AsyncSession, partner_id: int, timeframe: str = '7D') -> List[dict]:
    """
    Returns data points for a growth chart using Materialized Path.
    Optimized for high-concurrency and large networks.
    """
    partner = await session.get(Partner, partner_id)
    if not partner: return []

    now = datetime.utcnow()
    # Configuration Mapping
    TF_CONFIG = {
        '24H': ('hour', now - timedelta(hours=24), 24),
        '7D':  ('day',  now - timedelta(days=7),   7),
        '1M':  ('day',  now - timedelta(days=30),  30),
        '3M':  ('day',  now - timedelta(days=90),  9), # Changed to 9 buckets for 90 days (10 days each)
        '6M':  ('month',now - timedelta(days=180), 6),
        '1Y':  ('month',now - timedelta(days=365), 12)
    }
    interval, start_time, points = TF_CONFIG.get(timeframe, TF_CONFIG['7D'])

    search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
    base_depth = len(search_path.split('.'))
    is_sqlite = "sqlite" in settings.DATABASE_URL

    # Database-specific bucketing logic
    if is_sqlite:
        bucket_column = {
            'hour': "strftime('%Y-%m-%d %H:00:00', created_at)",
            'day':  "strftime('%Y-%m-%d 00:00:00', created_at)",
            'month':"strftime('%Y-%m-01 00:00:00', created_at)"
        }.get(interval)
    else:
        bucket_column = f"date_trunc('{interval}', created_at)"

    # Query 1: Fetch buckatized counts for the timeframe
    query = text(f"""
        SELECT 
            {bucket_column} as bucket,
            depth - :base_depth + 1 as level, 
            COUNT(*) as count
        FROM partner
        WHERE (path = :search_path OR path LIKE :search_wildcard)
        AND created_at >= :start
        AND (depth - :base_depth + 1) BETWEEN 1 AND 9
        GROUP BY 1, 2
        ORDER BY 1 ASC;
    """)

    result = await session.execute(query, {
        "search_path": search_path,
        "search_wildcard": f"{search_path}.%",
        "start": start_time,
        "base_depth": base_depth
    })

    # Prepare data map {bucket_dt: {level: count}}
    data_map = {}
    for row in result.all():
        bucket = row[0]
        if isinstance(bucket, str):
            bucket = datetime.strptime(bucket, '%Y-%m-%d %H:%M:%S')
        bucket = bucket.replace(tzinfo=None)
        level, count = int(row[1]), int(row[2])
        if bucket not in data_map:
            data_map[bucket] = {lvl: 0 for lvl in range(1, 10)}
        data_map[bucket][level] = count

    # Query 2: Fetch Base Totals (Cumulative count before timeframe)
    stmt_base = text("""
        SELECT depth - :base_depth + 1 as level, COUNT(*)
        FROM partner
        WHERE (path = :search_path OR path LIKE :search_wildcard)
        AND created_at < :start
        AND (depth - :base_depth + 1) BETWEEN 1 AND 9
        GROUP BY 1
    """)
    res_base = await session.execute(stmt_base, {
        "search_path": search_path,
        "search_wildcard": f"{search_path}.%",
        "start": start_time,
        "base_depth": base_depth
    })
    
    running_totals = {lvl: 0 for lvl in range(1, 10)}
    for row in res_base.all():
        running_totals[int(row[0])] = int(row[1])

    # Assemble Output Data Points
    data = []
    curr = start_time
    
    # Pre-calculate steps to avoid repeated timedelta addition logic
    def get_next_bucket(c):
        if interval == 'hour': return c + timedelta(hours=1), f"{c.hour:02d}:00", c.replace(minute=0, second=0, microsecond=0)
        if interval == 'day': return c + timedelta(days=1), f"{c.day:02d}/{c.month:02d}", c.replace(hour=0, minute=0, second=0, microsecond=0)
        # Month-aware step
        next_month = c.month % 12 + 1
        year_step = 1 if c.month == 12 else 0
        nb = c.replace(year=c.year + year_step, month=next_month, day=1, hour=0, minute=0, second=0, microsecond=0)
        return nb, c.strftime("%b"), c.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    for i in range(points + 1):
        next_curr, label, bucket_key = get_next_bucket(curr)
        bucket_data = data_map.get(bucket_key, {lvl: 0 for lvl in range(1, 10)})
        
        # Accumulate totals
        for lvl in range(1, 10):
            running_totals[lvl] += bucket_data[lvl]

        data.append({
            "date": label,
            "total": sum(running_totals.values()),
            "levels": [running_totals[lvl] for lvl in range(1, 10)],
            "joined_per_level": [bucket_data[lvl] for lvl in range(1, 10)]
        })
        curr = next_curr

    return data
