import secrets
import logging
from typing import Optional, List, Dict, Tuple
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, XPTransaction
from datetime import datetime, timedelta
from app.core.i18n import get_msg
from app.services.leaderboard_service import leaderboard_service
from app.services.redis_service import redis_service
from app.services.notification_service import notification_service
from app.utils.ranking import get_level

logger = logging.getLogger(__name__)

async def create_partner(
    session: AsyncSession,
    telegram_id: str,
    username: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    language_code: Optional[str] = "en",
    referrer_code: Optional[str] = None
) -> Tuple[Partner, bool]:
    """
    Creates a new partner or retrieves an existing one.
    Handles referral linkage via referral_code.
    """
    # 1. Check if partner exists
    statement = select(Partner).where(Partner.telegram_id == telegram_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if partner:
        return partner, False
        
    # 2. Assign Referrer if code exists
    referrer_id = None
    referrer = None
    if referrer_code:
        try:
            # 2a. Try direct code match
            ref_stmt = select(Partner).where(Partner.referral_code == referrer_code)
            ref_res = await session.exec(ref_stmt)
            referrer = ref_res.first()
            
            if referrer:
                referrer_id = referrer.id
        except Exception as e:
            logger.error(f"Error resolving referrer_code {referrer_code}: {e}")

    # 3. Create fresh partner with path
    path = None
    if referrer:
        parent_path = referrer.path or ""
        path = f"{parent_path}.{referrer.id}".lstrip(".")

    partner = Partner(
        telegram_id=telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name,
        language_code=language_code,
        referral_code=f"P2P-{secrets.token_hex(4).upper()}",
        referrer_id=referrer_id,
        path=path
    )
    session.add(partner)
    await session.commit()
    await session.refresh(partner)
    
    return partner, True

async def process_referral_notifications(bot, session: AsyncSession, partner: Partner, is_new: bool):
    """
    Wrapper to trigger the recursive referral logic for new signups.
    """
    if is_new and partner.referrer_id:
        # Offload to the optimized recursive logic
        await process_referral_logic.kiq(partner.id)


async def get_partner_by_telegram_id(session: AsyncSession, telegram_id: str) -> Optional[Partner]:
    statement = select(Partner).where(Partner.telegram_id == telegram_id)
    result = await session.exec(statement)
    return result.first()

async def get_partner_by_referral_code(session: AsyncSession, code: str) -> Optional[Partner]:
    statement = select(Partner).where(Partner.referral_code == code)
    result = await session.exec(statement)
    return result.first()

from app.worker import broker

@broker.task(task_name="process_referral_logic")
async def process_referral_logic(partner_id: int):
    """
    Optimized 9-level referral logic.
    Run as a background task via TaskIQ.
    """
    from app.models.partner import Partner, XPTransaction, get_session
    from app.core.config import settings
    # We need a new session for the background task
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlmodel.ext.asyncio.session import AsyncSession
    from sqlalchemy.orm import sessionmaker

    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        partner = await session.get(Partner, partner_id)
        if not partner or not partner.referrer_id:
            return

        # 1. Reconstruct Lineage IDs (L1 to L9)
        # partner.path already includes the referrer_id as the last element.
        lineage_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
        lineage_ids = lineage_ids[-9:]
        
        # 2. Bulk Fetch all ancestors
        statement = select(Partner).where(Partner.id.in_(lineage_ids))
        result = await session.exec(statement)
        ancestor_map = {p.id: p for p in result.all()}

        # XP distribution configuration
        XP_MAP = {1: 35, 2: 10, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1}
        
        current_referrer_id = partner.referrer_id
        for level in range(1, 10):
            if not current_referrer_id:
                break
                
            referrer = ancestor_map.get(current_referrer_id)
            if not referrer:
                break
                
            # 1. Distribute XP
            xp_gain = XP_MAP.get(level, 0)
            referrer.xp += xp_gain
            
            xp_tx = XPTransaction(
                partner_id=referrer.id,
                amount=xp_gain,
                type="REFERRAL_L1" if level == 1 else "REFERRAL_DEEP",
                description=f"Referral XP reward from Level {level}",
                reference_id=str(partner.id)
            )
            session.add(xp_tx)

            # 1.2 Unified Transaction: Log XP as an Earning
            from app.models.partner import Earning
            xp_earning = Earning(
                partner_id=referrer.id,
                amount=xp_gain,
                description=f"Referral XP Reward (Level {level})",
                type="REFERRAL_XP",
                level=level,
                currency="XP"
            )
            session.add(xp_earning)
            
            # 2. Handle Level Up Logic
            new_level = get_level(referrer.xp)
            if new_level > referrer.level:
                # Level Up!
                for l in range(referrer.level + 1, new_level + 1):
                    try:
                        lang = referrer.language_code or "en"
                        msg = get_msg(lang, "level_up", level=l)
                        await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)
                    except Exception: pass
                referrer.level = new_level
                
            # 3. Sync to Redis Leaderboard
            await leaderboard_service.update_score(referrer.id, referrer.xp)
            
            # 4. Invalidate Profile Cache
            await redis_service.client.delete(f"partner:profile:{referrer.telegram_id}")
            
            # 5. Send Notification
            try:
                lang = referrer.language_code or "en"
                if level == 1:
                    name = partner.first_name or partner.username or "Partner"
                    msg = get_msg(lang, "referral_l1_congrats", name=name, username=f" (@{partner.username})" if partner.username else "")
                elif level == 2:
                    msg = get_msg(lang, "referral_l2_congrats")
                else:
                    msg = get_msg(lang, "referral_deep_activity", level=level)
                await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)
            except Exception: pass

            session.add(referrer)
            current_referrer_id = referrer.referrer_id  # Move up the chain

        await session.commit()
    
    await engine.dispose()

async def distribute_pro_commissions(session: AsyncSession, partner_id: int, total_amount: float):
    """
    Distributes commissions for PRO subscription purchase across 9 levels.
    L1: 30%, L2: 5%, L3: 3%, L4-9: 1%
    """
    from app.models.partner import Partner, Earning
    
    partner = await session.get(Partner, partner_id)
    if not partner or not partner.referrer_id:
        return

    # COMMISSION MAP
    COMMISSION_PCT = {1: 0.30, 2: 0.05, 3: 0.03, 4: 0.01, 5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01}
    
    # Get Lineage
    path_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
    lineage_ids = (path_ids + [partner.referrer_id])[-9:]
    
    # Fetch ancestors
    statement = select(Partner).where(Partner.id.in_(lineage_ids))
    result = await session.exec(statement)
    ancestor_map = {p.id: p for p in result.all()}
    
    current_referrer_id = partner.referrer_id
    for level in range(1, 10):
        if not current_referrer_id:
            break
            
        referrer = ancestor_map.get(current_referrer_id)
        if not referrer:
            break
            
        pct = COMMISSION_PCT.get(level, 0)
        commission = total_amount * pct
        
        if commission > 0:
            referrer.balance += commission
            
            # Log Commission Earning
            earning = Earning(
                partner_id=referrer.id,
                amount=commission,
                description=f"PRO Commission (Level {level})",
                type="PRO_COMMISSION",
                level=level,
                currency="USDT"
            )
            session.add(earning)
            session.add(referrer)
            
            # Invalidate cache
            await redis_service.client.delete(f"partner:profile:{referrer.telegram_id}")
            await redis_service.client.delete(f"partner:earnings:{referrer.telegram_id}")
            
            # Notify
            try:
                lang = referrer.language_code or "en"
                msg = get_msg(lang, "commission_received", amount=round(commission, 2), level=level)
                await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)
            except Exception: pass

        current_referrer_id = referrer.referrer_id
    
    await session.commit()

async def get_referral_tree_stats(session: AsyncSession, partner_id: int) -> dict[int, int]:
    """
    Uses Materialized Path for ultra-fast 9-level tree counting.
    Cached in Redis to avoid repeat execution.
    """
    cache_key = f"ref_tree_stats:{partner_id}"
    cached = await redis_service.get_json(cache_key)
    if cached: return {int(k): v for k, v in cached.items()}

    # Optimized Query using Path
    # We look for path starting with partner_id. or being exactly partner_id (if we want self, but normally we want descendants)
    # For descendants, path starts with f"{root_path}.{partner_id}." or IS f"{root_path}.{partner_id}" (if root_path empty)
    
    # Let's get the partner first to know their path base
    partner = await session.get(Partner, partner_id)
    if not partner: return {i: 0 for i in range(1, 10)}
    
    base_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
    
    base_dots = base_path.count('.') if base_path else -1
    
    # Query: Count partners where path starts with base_path
    # We calculate level by counting dots in the path relative to base_path dots
    query = text("""
        SELECT 
            (length(COALESCE(path, '')) - length(replace(COALESCE(path, ''), '.', ''))) - :base_dots + 1 as tree_level,
            COUNT(*) as count
        FROM partner
        WHERE (path = :base_path OR path LIKE :base_path || '.%')
        GROUP BY tree_level
        HAVING tree_level BETWEEN 1 AND 9
        ORDER BY tree_level;
    """)
    
    result = await session.execute(query, {"base_path": base_path, "base_dots": base_dots})
    stats = {i: 0 for i in range(1, 10)}
    for row in result:
        lvl = int(row[0])
        if 1 <= lvl <= 9:
            stats[lvl] = row[1]
        
    await redis_service.set_json(cache_key, stats, expire=300)
    return stats

async def get_referral_tree_members(session: AsyncSession, partner_id: int, target_level: int) -> List[dict]:
    """
    Fetches details of partners at a specific level using Materialized Path.
    """
    if not (1 <= target_level <= 9):
        return []

    cache_key = f"ref_tree_members:{partner_id}:{target_level}"
    cached = await redis_service.get_json(cache_key)
    if cached: return cached

    partner = await session.get(Partner, partner_id)
    if not partner: return []
    
    base_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
    
    # Calculate exact path depth for the target level
    # Level 1 means path == base_path
    # Level 2 means path == base_path.child_id (one dot more than base_path)
    base_dots = base_path.count('.') if base_path else -1
    target_dots = base_dots + target_level - 1
    
    query = text("""
        SELECT telegram_id, username, first_name, last_name, xp, photo_url, created_at, path
        FROM partner
        WHERE (path = :base_path OR path LIKE :base_path || '.%')
        AND (length(path) - length(replace(path, '.', ''))) = :target_dots
        ORDER BY xp DESC
        LIMIT 100;
    """)
    
    try:
        result = await session.execute(query, {"base_path": base_path, "target_dots": target_dots})
        members = []
        for row in result:
            members.append({
                "telegram_id": row[0],
                "username": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "xp": row[4],
                "photo_url": row[5],
                "joined_at": row[6].isoformat() if row[6] else None
            })
        
        await redis_service.set_json(cache_key, members, expire=300)
        return members
    except Exception as e:
        logger.error(f"Error fetching tree members: {e}")
        return []

async def get_network_growth_metrics(session: AsyncSession, partner_id: int, timeframe: str = '7D') -> dict:
    """
    Calculates partners joined in the current period vs the previous period.
    Periods are defined by the timeframe (e.g., 7D = current 7 days vs previous 7 days).
    """
    cache_key = f"growth_metrics:{partner_id}:{timeframe}"
    cached = await redis_service.get_json(cache_key)
    if cached: return cached

    partner = await session.get(Partner, partner_id)
    if not partner: return {"growth_pct": 0, "previous_count": 0, "current_count": 0}

    now = datetime.utcnow()
    
    # Define period length
    if timeframe == '24H': delta = timedelta(hours=24)
    elif timeframe == '7D': delta = timedelta(days=7)
    elif timeframe == '1M': delta = timedelta(days=30)
    elif timeframe == '3M': delta = timedelta(days=90)
    elif timeframe == '6M': delta = timedelta(days=180)
    elif timeframe == '1Y': delta = timedelta(days=365)
    else: delta = timedelta(days=7)

    current_start = now - delta
    previous_start = now - (delta * 2)

    base_path = f"{partner.path or ''}.{partner.id}".lstrip(".")

    # Query Current Period
    stmt_curr = text("""
        SELECT COUNT(*) FROM partner 
        WHERE (path = :path OR path LIKE :path || '.%')
        AND created_at >= :start AND created_at <= :end
    """)
    res_curr = await session.execute(stmt_curr, {"path": base_path, "start": current_start, "end": now})
    current_count = res_curr.scalar() or 0

    # Query Previous Period
    stmt_prev = text("""
        SELECT COUNT(*) FROM partner 
        WHERE (path = :path OR path LIKE :path || '.%')
        AND created_at >= :start AND created_at < :end
    """)
    res_prev = await session.execute(stmt_prev, {"path": base_path, "start": previous_start, "end": current_start})
    previous_count = res_prev.scalar() or 0

    # Calculate Growth %
    if previous_count == 0:
        growth_pct = 100.0 if current_count > 0 else 0.0
    else:
        growth_pct = ((current_count - previous_count) / previous_count) * 100.0

    result_data = {
        "growth_pct": round(growth_pct, 1),
        "current_count": current_count,
        "previous_count": previous_count,
        "timeframe": timeframe
    }
    
    await redis_service.set_json(cache_key, result_data, expire=300)
    return result_data

async def get_network_time_series(session: AsyncSession, partner_id: int, timeframe: str = '7D') -> List[dict]:
    """
    Returns data points for a growth chart, grouped by the appropriate interval.
    """
    cache_key = f"growth_chart:{partner_id}:{timeframe}"
    cached = await redis_service.get_json(cache_key)
    if cached: return cached

    partner = await session.get(Partner, partner_id)
    if not partner: return []

    now = datetime.utcnow()
    
    # Intervals: 24H -> Hour, 7D/1M -> Day, 3M/6M/1Y -> Month/Week
    if timeframe == '24H':
        interval = 'hour'
        start_time = now - timedelta(hours=24)
        points = 24
    elif timeframe == '7D':
        interval = 'day'
        start_time = now - timedelta(days=7)
        points = 7
    elif timeframe == '1M':
        interval = 'day'
        start_time = now - timedelta(days=30)
        points = 30
    else:
        interval = 'month' # Simple fallback for large periods
        start_time = now - timedelta(days=365)
        points = 12

    base_path = f"{partner.path or ''}.{partner.id}".lstrip(".")

    # Query counts grouped by interval
    # Note: date_trunc is Postgres specific
    query = text(f"""
        SELECT date_trunc('{interval}', created_at) as bucket, COUNT(*) 
        FROM partner 
        WHERE (path = :path OR path LIKE :path || '.%')
        AND created_at >= :start
        GROUP BY bucket
        ORDER BY bucket ASC
    """)
    
    result = await session.execute(query, {"path": base_path, "start": start_time})
    
    data_map = {row[0]: row[1] for row in result}
    
    # Fill gaps for a smooth chart
    data = []
    curr = start_time
    running_total = 0 # If we want an area chart showing cumulative total, we need a base
    
    # Get base count (partners joined BEFORE start_time)
    stmt_base = text("""
        SELECT COUNT(*) FROM partner 
        WHERE (path = :path OR path LIKE :path || '.%')
        AND created_at < :start
    """)
    res_base = await session.execute(stmt_base, {"path": base_path, "start": start_time})
    running_total = res_base.scalar() or 0

    for i in range(points + 1):
        # Normalize current time bucket
        if interval == 'hour':
            bucket = curr.replace(minute=0, second=0, microsecond=0)
            label = f"{bucket.hour:02d}:00"
            next_step = timedelta(hours=1)
        elif interval == 'day':
            bucket = curr.replace(hour=0, minute=0, second=0, microsecond=0)
            label = f"{bucket.day:02d}/{bucket.month:02d}"
            next_step = timedelta(days=1)
        else:
            bucket = curr.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            label = bucket.strftime("%b")
            next_step = timedelta(days=32) # approximate to hit next month
            # Fix month logic
            if bucket.month == 12: next_step_bucket = bucket.replace(year=bucket.year + 1, month=1)
            else: next_step_bucket = bucket.replace(month=bucket.month + 1)
            next_step = next_step_bucket - bucket

        count = 0
        # Check if we have data for this bucket in Postgres's format (timezone naive)
        for b, c in data_map.items():
             if b.replace(tzinfo=None) == bucket:
                 count = c
                 break
        
        running_total += count
        data.append({
            "date": label,
            "total": running_total,
            "joined": count
        })
        curr += next_step

    await redis_service.set_json(cache_key, data, expire=300)
    return data
    """
    Utility to hydrate the 'path' column for all existing partners.
    Call this once to upgrade existing database.
    """
    # Simple recursive approach for migration (since it's a one-time thing)
    async def update_children(parent_id: int, parent_path: str):
        stmt = select(Partner).where(Partner.referrer_id == parent_id)
        res = await session.exec(stmt)
        children = res.all()
        for child in children:
            child.path = f"{parent_path}.{parent_id}".lstrip(".")
            session.add(child)
            await update_children(child.id, child.path)

    # Start from root partners (no referrer)
    stmt = select(Partner).where(Partner.referrer_id == None)
    res = await session.exec(stmt)
    roots = res.all()
    for root in roots:
        root.path = None
        session.add(root)
        await update_children(root.id, "")
    
    await session.commit()
