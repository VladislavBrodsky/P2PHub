import logging
import secrets
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.i18n import get_msg
# #comment: Consolidated imports at the module level to ensure cleaner dependency resolution
# and prevent CI failures related to undefined names (like 'settings') in background tasks.
from app.core.config import settings
from app.models.partner import Partner, XPTransaction
from app.services.leaderboard_service import leaderboard_service
from app.services.notification_service import notification_service
from app.services.redis_service import redis_service
from app.utils.ranking import get_level

logger = logging.getLogger(__name__)

async def create_partner(
    session: AsyncSession,
    telegram_id: str,
    username: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    language_code: Optional[str] = "en",
    referrer_code: Optional[str] = None,
    photo_file_id: Optional[str] = None
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

    # 3. Create partner with path
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
        photo_file_id=photo_file_id,
        path=path
    )
    session.add(partner)
    await session.commit()
    await session.refresh(partner)

    # 3.5 Sync to Redis Leaderboard
    try:
        await leaderboard_service.update_score(partner.id, partner.xp)
    except Exception: pass

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

    # 4.5 Invalidate Global Recent Partners list (Redis only)
    # The refresh logic in get_recent_partners will handle the actual data fetch.
    try:
        await redis_service.client.delete("partners:recent_v2")
    except Exception as e:
        logger.error(f"Failed to invalidate global recent partners cache: {e}")

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
    from sqlalchemy.orm import sessionmaker
    from sqlmodel import select
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.core.i18n import get_msg
    from app.models.partner import Partner, engine  # Use GLOBAL engine
    from app.services.leaderboard_service import leaderboard_service
    from app.services.notification_service import notification_service
    from app.services.redis_service import redis_service

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
            ancestor_list = result.all()
            ancestor_map = {p.id: p for p in ancestor_list}

            # XP distribution configuration
            XP_MAP = {1: 35, 2: 10, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1}

            current_referrer_id = partner.referrer_id
            logger.info(f"🔄 Processing referral logic for partner {partner_id} (@{partner.username}). Referrer: {current_referrer_id}")

            for level in range(1, 10):
                if not current_referrer_id:
                    break

                referrer = ancestor_map.get(current_referrer_id)
                if not referrer:
                    logger.warning(f"⚠️ Ancestor {current_referrer_id} not found in map for partner {partner_id} at level {level}")
                    break

                try:
                    # --- CORE OPERATION: XP DISTRIBUTION (GOLDEN RULE) ---
                    xp_gain = XP_MAP.get(level, 0)
                    if referrer.is_pro:
                        xp_gain *= 3  # PRO members get 3x XP bonus

                    # ATOMIC SQL INCREMENT (Resilient to concurrency)
                    # We use a direct text query or SQLAlchemy expression to avoid race conditions
                    await session.execute(
                        text("UPDATE partner SET xp = xp + :gain, referral_count = referral_count + 1 WHERE id = :p_id"),
                        {"gain": xp_gain, "p_id": referrer.id}
                    )

                    xp_tx = XPTransaction(
                        partner_id=referrer.id,
                        amount=xp_gain,
                        type="REFERRAL_L1" if level == 1 else "REFERRAL_DEEP",
                        description=f"Referral XP Reward (L{level})",
                        reference_id=str(partner.id)
                    )
                    session.add(xp_tx)

                    from app.models.partner import Earning
                    xp_earning = Earning(
                        partner_id=referrer.id,
                        amount=xp_gain,
                        description=f"Referral XP Reward (L{level})",
                        type="REFERRAL_XP",
                        level=level,
                        currency="XP"
                    )
                    session.add(xp_earning)

                    # Flush to ensure XP is captured in the transaction
                    await session.flush()

                    # Refresh referrer object to pick up the atomic changes for side effects (like level up)
                    await session.refresh(referrer)
                    logger.info(f"💰 [Level {level}] XP Awarded: {xp_gain} to {referrer.id}")

                except Exception as core_error:
                    logger.critical(f"❌ CRITICAL: Failed to award XP for {referrer.id} at level {level}: {core_error}")
                    # If core operation fails for one user, we might still want to try for others,
                    # but usually this means DB issue. We continue to next level just in case.
                    continue

                # --- SIDE EFFECTS: ISOLATED FROM CORE ---
                # 2. Handle Level Up Logic
                try:
                    new_level = get_level(referrer.xp)
                    if new_level > referrer.level:
                        for lvl in range(referrer.level + 1, new_level + 1):
                            try:
                                lang = referrer.language_code or "en"
                                msg = get_msg(lang, "level_up", level=lvl)
                                await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)

                                # Admin Alert for important milestones (Level 50+)
                                if lvl >= 50:
                                    admin_msg = (
                                        f"⭐️ *ELITE MILESTONE* ⭐️\n\n"
                                        f"👤 *Partner:* {referrer.first_name} (@{referrer.username})\n"
                                        f"🚀 *Reached Level:* {lvl}\n"
                                        f"💎 *XP:* {referrer.xp}\n\n"
                                        "A new leader is rising!"
                                    )
                                    for admin_id in settings.ADMIN_USER_IDS:
                                        try:
                                            await notification_service.enqueue_notification(chat_id=int(admin_id), text=admin_msg)
                                        except Exception: pass

                            except Exception: pass
                        referrer.level = new_level
                except Exception as e:
                    logger.error(f"⚠️ Level up logic failed for {referrer.id}: {e}")

                # 3. Redis Side Effects
                try:
                    await leaderboard_service.update_score(referrer.id, referrer.xp)
                    await redis_service.client.delete(f"partner:profile:{referrer.telegram_id}")

                    # Also invalidate Network Tree caches to ensure real-time visibility in Explorer
                    await redis_service.client.delete(f"ref_tree_stats:{referrer.id}")
                    if level == 1:
                        await redis_service.client.delete(f"ref_tree_members:{referrer.id}:1")
                except Exception as e:
                    logger.error(f"⚠️ Redis sync/invalidation failed for {referrer.id}: {e}")

                # 4. Referral Notifications
                try:
                    lang = referrer.language_code or "en"
                    new_partner_name = f"{partner.first_name}"
                    if partner.username:
                        new_partner_name += f" (@{partner.username})"

                    msg = None
                    if level == 1:
                        msg = get_msg(lang, "referral_l1_congrats", name=new_partner_name)
                    else:
                        path_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
                        try:
                            start_idx = path_ids.index(referrer.id)
                            intermediary_ids = path_ids[start_idx+1:]
                            chain_names = []
                            for mid_id in intermediary_ids:
                                mid_user = ancestor_map.get(mid_id)
                                if mid_user:
                                    name = mid_user.first_name or "Unknown"
                                    if mid_user.username:
                                        name += f" (@{mid_user.username})"
                                    chain_names.append(name)
                            chain_names.append(new_partner_name)
                            referral_chain = "\n".join([f"➜ {name}" for name in chain_names])

                            if level == 2:
                                msg = get_msg(lang, "referral_l2_congrats", referral_chain=referral_chain)
                            else:
                                msg = get_msg(lang, "referral_deep_activity", level=level, referral_chain=referral_chain)
                        except Exception: pass

                    if msg:
                        await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)
                except Exception as e:
                    logger.error(f"⚠️ Notification failed for {referrer.id}: {e}")

                current_referrer_id = referrer.referrer_id  # Move up the chain

            await session.commit()
            logger.info(f"✅ Successfully processed all levels for partner {partner_id}")


    except Exception as e:
        import logging
        logging.error(f"Error in process_referral_logic: {e}")

async def distribute_pro_commissions(session: AsyncSession, partner_id: int, total_amount: float):
    """
    Distributes commissions for PRO subscription purchase across 9 levels.
    L1: 30%, L2: 5%, L3: 3%, L4-9: 1%
    """
    from app.models.partner import Earning, Partner

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
            # ATOMIC SQL INCREMENT for Commissions
            await session.execute(
                text("UPDATE partner SET balance = balance + :comm, total_earned_usdt = total_earned_usdt + :comm WHERE id = :p_id"),
                {"comm": commission, "p_id": referrer.id}
            )

            # Log Commission Earning
            earning = Earning(
                partner_id=referrer.id,
                amount=commission,
                description=f"PRO Commission (L{level})",
                type="PRO_COMMISSION",
                level=level,
                currency="USDT"
            )
            session.add(earning)

            # Refresh to pick up changes for cache consistency
            await session.refresh(referrer)

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

async def get_referral_tree_stats(session: AsyncSession, partner_id: int) -> dict[str, int]:
    """
    Uses Materialized Path for ultra-fast 9-level tree counting.
    """
    partner = await session.get(Partner, partner_id)
    if not partner: return {f"level_{i}": 0 for i in range(1, 10)}

    # Materialized Path prefix: current_path + current_id
    search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
    base_depth = len(search_path.split('.'))

    # Calculate levels using the distance from base_depth
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

    search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")

    # Query Current Period
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

    # Query Previous Period
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

    return result_data

async def get_network_time_series(session: AsyncSession, partner_id: int, timeframe: str = '7D') -> List[dict]:
    """
    Returns data points for a growth chart using Materialized Path.
    """
    partner = await session.get(Partner, partner_id)
    if not partner: return []

    now = datetime.utcnow()

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

    search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
    base_depth = len(search_path.split('.'))

    # Detect dialect to support both SQLite and Postgres
    is_sqlite = "sqlite" in settings.DATABASE_URL

    if is_sqlite:
        if interval == 'hour':
            bucket_expr = "strftime('%Y-%m-%d %H:00:00', created_at)"
        elif interval == 'day':
            bucket_expr = "strftime('%Y-%m-%d 00:00:00', created_at)"
        else: # month
            bucket_expr = "strftime('%Y-%m-01 00:00:00', created_at)"
    else:
        bucket_expr = f"date_trunc('{interval}', created_at)"

    # Path-based query for buckets and levels
    query = text("""
        SELECT bucket, level, COUNT(*) as count
        FROM (
            SELECT
                {} as bucket,
                (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) - :base_depth + 1 as level
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            AND created_at >= :start
        ) as subquery
        WHERE level >= 1 AND level <= 9
        GROUP BY 1, 2
        ORDER BY bucket ASC, level ASC;
    """.format(bucket_expr))

    result = await session.execute(query, {
        "search_path": search_path,
        "search_wildcard": f"{search_path}.%",
        "start": start_time,
        "base_depth": base_depth
    })

    data_map = {}
    rows = result.all()
    for row in rows:
        bucket = row[0]
        # SQLite returns string for strftime, PostGres returns datetime
        if isinstance(bucket, str):
             # Format depends on interval: '2025-01-01 10:00:00'
             bucket = datetime.strptime(bucket, '%Y-%m-%d %H:%M:%S')

        bucket = bucket.replace(tzinfo=None)
        level = int(row[1])
        count = int(row[2])
        if bucket not in data_map:
            data_map[bucket] = {lvl: 0 for lvl in range(1, 10)}
        data_map[bucket][level] = count

    # Path-based base count per level
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
    res_base_list = res_base.all()
    running_totals = {lvl: 0 for lvl in range(1, 10)}
    for row in res_base_list:
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
    stmt = select(Partner).where(Partner.referrer_id is None)
    res = await session.exec(stmt)
    roots = res.all()
    for root in roots:
        if root.path is not None:
            root.path = None
            session.add(root)
        await update_children(root.id, "")

    await session.commit()
