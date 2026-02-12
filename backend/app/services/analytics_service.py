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
        SELECT level, COUNT(*) as count
        FROM (
            SELECT (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) - :base_depth + 1 as level
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
        ) as subquery
        WHERE level >= 1 AND level <= 9
        GROUP BY 1
        ORDER BY level;
    """)

    result = await session.execute(query, {
        "search_path": search_path,
        "search_wildcard": f"{search_path}.%",
        "base_depth": base_depth
    })

    stats = {f"level_{i}": 0 for i in range(1, 10)}
    rows = result.all()
    for row in rows:
        lvl = int(row[0])
        if 1 <= lvl <= 9:
            stats[f"level_{lvl}"] = row[1]

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
        FROM (
            SELECT *, (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) as depth
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
        ) as subquery
        WHERE depth = :target_depth
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
    """
    partner = await session.get(Partner, partner_id)
    if not partner: return []

    now = datetime.utcnow()
    if timeframe == '24H':
        interval, start_time, points = 'hour', now - timedelta(hours=24), 24
    elif timeframe == '7D':
        interval, start_time, points = 'day', now - timedelta(days=7), 7
    elif timeframe == '1M':
        interval, start_time, points = 'day', now - timedelta(days=30), 30
    else:
        interval, start_time, points = 'month', now - timedelta(days=365), 12

    search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
    base_depth = len(search_path.split('.'))
    is_sqlite = "sqlite" in settings.DATABASE_URL

    if is_sqlite:
        if interval == 'hour': bucket_column = "strftime('%Y-%m-%d %H:00:00', created_at)"
        elif interval == 'day': bucket_column = "strftime('%Y-%m-%d 00:00:00', created_at)"
        else: bucket_column = "strftime('%Y-%m-01 00:00:00', created_at)"
    else:
        valid_intervals = {'hour', 'day', 'month', 'week'}
        safe_interval = interval if interval in valid_intervals else 'day'
        bucket_column = f"date_trunc('{safe_interval}', created_at)"

    query = text(f"""
        SELECT bucket, level, COUNT(*) as count
        FROM (
            SELECT
                {bucket_column} as bucket,
                (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) - :base_depth + 1 as level
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            AND created_at >= :start
        ) as subquery
        WHERE level >= 1 AND level <= 9
        GROUP BY 1, 2
        ORDER BY bucket ASC, level ASC;
    """)

    result = await session.execute(query, {
        "search_path": search_path,
        "search_wildcard": f"{search_path}.%",
        "start": start_time,
        "base_depth": base_depth
    })

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

    stmt_base = text("""
        SELECT level, COUNT(*)
        FROM (
            SELECT
                (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) - :base_depth + 1 as level
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            AND created_at < :start
        ) as base_subquery
        WHERE level >= 1 AND level <= 9
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

    data = []
    curr = start_time
    for i in range(points + 1):
        if interval == 'hour':
            bucket = curr.replace(minute=0, second=0, microsecond=0)
            label, next_step = f"{bucket.hour:02d}:00", timedelta(hours=1)
        elif interval == 'day':
            bucket = curr.replace(hour=0, minute=0, second=0, microsecond=0)
            label, next_step = f"{bucket.day:02d}/{bucket.month:02d}", timedelta(days=1)
        else:
            bucket = curr.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            label = bucket.strftime("%b")
            if bucket.month == 12: next_bucket = bucket.replace(year=bucket.year + 1, month=1)
            else: next_bucket = bucket.replace(month=bucket.month + 1)
            next_step = next_bucket - bucket

        bucket_data = data_map.get(bucket, {lvl: 0 for lvl in range(1, 10)})
        for lvl in range(1, 10):
            running_totals[lvl] += bucket_data[lvl]

        data.append({
            "date": label,
            "total": sum(running_totals.values()),
            "levels": [running_totals[lvl] for lvl in range(1, 10)],
            "joined_per_level": [bucket_data[lvl] for lvl in range(1, 10)]
        })
        curr += next_step

    return data
