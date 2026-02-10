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
    
    # 4. Invalidate referral tree stats for ancestors
    if referrer:
        try:
            # Reconstruct lineage for invalidation (up to 9 levels)
            anc_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
            for anc_id in anc_ids[-9:]:
                await redis_service.client.delete(f"ref_tree_stats:{anc_id}")
                # Also invalidate Level 1 members for immediate referrer
                if anc_id == referrer.id:
                    await redis_service.client.delete(f"ref_tree_members:{anc_id}:1")
        except Exception as e:
            logger.error(f"Failed to invalidate cache for ancestors: {e}")
    
    return partner, True

async def process_referral_notifications(bot, session: AsyncSession, partner: Partner, is_new: bool):
    """
    Wrapper to trigger the recursive referral logic for new signups.
    """
    if is_new and partner.referrer_id:
        # Run logic in background via TaskIQ worker
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
    Run as a standard asyncio background task (no external broker needed).
    """
    from app.models.partner import Partner, XPTransaction, engine # Use GLOBAL engine
    from app.services.notification_service import notification_service
    from sqlalchemy.orm import sessionmaker
    from sqlmodel.ext.asyncio.session import AsyncSession
    from app.core.i18n import get_msg
    from app.services.leaderboard_service import leaderboard_service
    from app.services.redis_service import redis_service
    from app.utils.ranking import get_level
    from sqlmodel import select

    # Use the global engine, do NOT create a new one every time
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    try:
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
            if referrer.is_pro:
                xp_gain *= 5
                
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
                
                # Format New Partner Name
                new_partner_name = f"{partner.first_name}"
                if partner.username:
                    new_partner_name += f" (@{partner.username})"
                
                if level == 1:
                    msg = get_msg(lang, "referral_l1_congrats", name=new_partner_name)
                else:
                    # Construct Referral Chain for L2+
                    # We want to show the path from (but excluding) the ancestor down to the new partner
                    # Path: [Ancestor, Intermediary1, Intermediary2, ..., NewPartner]
                    
                    chain_names = []
                    
                    # 1. Get IDs between ancestor and new partner from the path
                    # partner.path is like "root.child.grandchild" (contains IDs of ancestors)
                    # We need to find where 'referrer.id' is and take everything after it
                    
                    path_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
                    
                    try:
                        # Find index of current ancestor (referrer)
                        start_idx = path_ids.index(referrer.id)
                        # Get intermediaries (ids after referrer)
                        intermediary_ids = path_ids[start_idx+1:]
                        
                        # Add intermediaries to chain
                        for mid_id in intermediary_ids:
                            mid_user = ancestor_map.get(mid_id)
                            if mid_user:
                                name = mid_user.first_name or "Unknown"
                                if mid_user.username:
                                    name += f" (@{mid_user.username})"
                                chain_names.append(name)
                                
                    except ValueError:
                        # Should not happen if logic is correct
                        pass

                    # Add the new partner at the end
                    chain_names.append(new_partner_name)
                    
                    # Format as vertical list with arrows
                    # ➜ User A
                    # ➜ User B
                    referral_chain = "\n".join([f"➜ {name}" for name in chain_names])
                    
                    if level == 2:
                        msg = get_msg(lang, "referral_l2_congrats", referral_chain=referral_chain)
                    else:
                        msg = get_msg(lang, "referral_deep_activity", level=level, referral_chain=referral_chain)
                
                await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)
            except Exception as e: 
                # logger.error(f"Notification error: {e}") 
                pass

            session.add(referrer)
            current_referrer_id = referrer.referrer_id  # Move up the chain

        await session.commit()
    
    except Exception as e:
        import logging
        logging.error(f"Error in process_referral_logic: {e}")

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
    Uses Recursive CTE for ultra-fast 9-level tree counting.
    More robust than Materialized Path for deeper/fragmented lineage.
    Cached in Redis to avoid repeat execution.
    """
    cache_key = f"ref_tree_stats:{partner_id}"
    cached = await redis_service.get_json(cache_key)
    if cached: return {int(k): v for k, v in cached.items()}

    # Recursive CTE to find all descendants up to level 9
    query = text("""
        WITH RECURSIVE descendants AS (
            -- Anchor member: immediate children of the partner
            SELECT id, referrer_id, 1 as level
            FROM partner
            WHERE referrer_id = :partner_id
            
            UNION ALL
            
            -- Recursive member: children of previously found descendants
            SELECT p.id, p.referrer_id, d.level + 1
            FROM partner p
            JOIN descendants d ON p.referrer_id = d.id
            WHERE d.level < 9
        )
        SELECT level, COUNT(*) as count
        FROM descendants
        GROUP BY level
        ORDER BY level;
    """)
    
    result = await session.execute(query, {"partner_id": partner_id})
    stats = {f"level_{i}": 0 for i in range(1, 10)}
    for row in result:
        lvl = int(row[0])
        if 1 <= lvl <= 9:
            stats[f"level_{lvl}"] = row[1]
        
    await redis_service.set_json(cache_key, stats, expire=1800) # 30 mins cache
    return stats

async def get_referral_tree_members(session: AsyncSession, partner_id: int, target_level: int) -> List[dict]:
    """
    Fetches details of partners at a specific level using Recursive CTE.
    """
    if not (1 <= target_level <= 9):
        return []

    cache_key = f"ref_tree_members:{partner_id}:{target_level}"
    cached = await redis_service.get_json(cache_key)
    if cached: return cached

    query = text("""
        WITH RECURSIVE descendants AS (
            SELECT id, 1 as level
            FROM partner
            WHERE referrer_id = :partner_id
            
            UNION ALL
            
            SELECT p.id, d.level + 1
            FROM partner p
            JOIN descendants d ON p.referrer_id = d.id
            WHERE d.level < :target_level
        )
        SELECT p.telegram_id, p.username, p.first_name, p.last_name, p.xp, p.photo_url, p.created_at,
               p.balance, p.level as partner_level, p.referral_code, p.is_pro, p.updated_at, p.id
        FROM partner p
        JOIN descendants d ON p.id = d.id
        WHERE d.level = :target_level
        ORDER BY p.xp DESC
        LIMIT 100;
    """)
    
    try:
        result = await session.execute(query, {"partner_id": partner_id, "target_level": target_level})
        members = []
        for row in result:
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
                "id": row[12]
            })
        
        await redis_service.set_json(cache_key, members, expire=1800)
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
        WITH RECURSIVE descendants AS (
            SELECT id FROM partner WHERE referrer_id = :partner_id
            UNION ALL
            SELECT p.id FROM partner p JOIN descendants d ON p.referrer_id = d.id
        )
        SELECT COUNT(*) FROM descendants d
        INNER JOIN partner p ON p.id = d.id
        WHERE p.created_at >= :start AND p.created_at <= :end
    """)
    res_curr = await session.execute(stmt_curr, {"partner_id": partner_id, "start": current_start, "end": now})
    current_count = res_curr.scalar() or 0

    # Query Previous Period
    stmt_prev = text("""
        WITH RECURSIVE descendants AS (
            SELECT id FROM partner WHERE referrer_id = :partner_id
            UNION ALL
            SELECT p.id FROM partner p JOIN descendants d ON p.referrer_id = d.id
        )
        SELECT COUNT(*) FROM descendants d
        INNER JOIN partner p ON p.id = d.id
        WHERE p.created_at >= :start AND p.created_at < :end
    """)
    res_prev = await session.execute(stmt_prev, {"partner_id": partner_id, "start": previous_start, "end": current_start})
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
    Includes level breakdown (1-9) for each bucket.
    """
    cache_key = f"growth_chart:v2:{partner_id}:{timeframe}"
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
    elif timeframe == '3M':
        interval = 'day'
        start_time = now - timedelta(days=90)
        points = 90
    else:
        interval = 'month'
        start_time = now - timedelta(days=365)
        points = 12

    # Recursive CTE to find all descendants up to level 9 and their creation bucket
    query = text(f"""
        WITH RECURSIVE descendants AS (
            -- Anchor: children of the partner
            SELECT id, 1 as level, created_at
            FROM partner
            WHERE referrer_id = :partner_id
            
            UNION ALL
            
            -- Recursive: children of descendants
            SELECT p.id, d.level + 1, p.created_at
            FROM partner p
            JOIN descendants d ON p.referrer_id = d.id
            WHERE d.level < 9
        )
        SELECT 
            date_trunc('{interval}', created_at) as bucket,
            level,
            COUNT(*) as count
        FROM descendants
        WHERE created_at >= :start
        GROUP BY bucket, level
        ORDER BY bucket ASC, level ASC;
    """)
    
    result = await session.execute(query, {"partner_id": partner_id, "start": start_time})
    
    # Organize into a map: {bucket: {level: count}}
    data_map = {}
    for row in result:
        bucket = row[0].replace(tzinfo=None)
        level = int(row[1])
        count = int(row[2])
        if bucket not in data_map:
            data_map[bucket] = {lvl: 0 for lvl in range(1, 10)}
        data_map[bucket][level] = count
    
    # Get base count per level (partners joined BEFORE start_time)
    stmt_base = text("""
        WITH RECURSIVE descendants AS (
            SELECT id, 1 as level, created_at
            FROM partner
            WHERE referrer_id = :partner_id
            UNION ALL
            SELECT p.id, d.level + 1, p.created_at
            FROM partner p
            JOIN descendants d ON p.referrer_id = d.id
            WHERE d.level < 9
        )
        SELECT level, COUNT(*) 
        FROM descendants
        WHERE created_at < :start
        GROUP BY level
    """)
    res_base = await session.execute(stmt_base, {"partner_id": partner_id, "start": start_time})
    running_totals = {lvl: 0 for lvl in range(1, 10)}
    for row in res_base:
        running_totals[int(row[0])] = int(row[1])

    # Fill gaps for a smooth chart
    data = []
    curr = start_time
    
    for i in range(points + 1):
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
            next_step = timedelta(days=32)
            if bucket.month == 12: next_step_bucket = bucket.replace(year=bucket.year + 1, month=1)
            else: next_step_bucket = bucket.replace(month=bucket.month + 1)
            next_step = next_step_bucket - bucket

        bucket_data = data_map.get(bucket, {lvl: 0 for lvl in range(1, 10)})
        
        # Update running totals with joined in this bucket
        for lvl in range(1, 10):
            running_totals[lvl] += bucket_data[lvl]
            
        data.append({
            "date": label,
            "total": sum(running_totals.values()),
            "levels": [running_totals[lvl] for lvl in range(1, 10)],
            "joined_per_level": [bucket_data[lvl] for lvl in range(1, 10)]
        })
        curr += next_step

    await redis_service.set_json(cache_key, data, expire=600)
    return data

async def migrate_paths(session: AsyncSession):
    """
    Utility to hydrate the 'path' column for all existing partners.
    Call this once to upgrade existing database.
    """
    # Simple recursive approach
    async def update_children(parent_id: int, parent_path: str):
        stmt = select(Partner).where(Partner.referrer_id == parent_id)
        res = await session.exec(stmt)
        children = res.all()
        for child in children:
            if not child.path or child.path != f"{parent_path}.{parent_id}".lstrip("."):
                child.path = f"{parent_path}.{parent_id}".lstrip(".")
                session.add(child)
                await update_children(child.id, child.path)
            else:
                 # Even if path is correct, recurse to check children? 
                 # Optimization: Recurse anyway just in case deep children are broken
                 await update_children(child.id, child.path)

    # Start from root partners (no referrer)
    stmt = select(Partner).where(Partner.referrer_id == None)
    res = await session.exec(stmt)
    roots = res.all()
    for root in roots:
        if root.path is not None:
            root.path = None
            session.add(root)
        await update_children(root.id, "")
    
    await session.commit()
