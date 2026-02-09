import secrets
import logging
from typing import Optional, List, Dict, Tuple
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner
from app.core.i18n import get_msg
from app.services.leaderboard_service import leaderboard_service
from app.services.redis_service import redis_service
from app.services.notification_service import notification_service

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
            
            # 2b. Fallback: Try Telegram ID (e.g. user shared "P12345" or just "12345")
            if not referrer:
                # Strip potential 'P' prefix common in some formats or user assumption
                potential_id = referrer_code.lstrip('P') if referrer_code.upper().startswith('P') else referrer_code
                if potential_id.isdigit():
                    ref_stmt = select(Partner).where(Partner.telegram_id == potential_id)
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
        await process_referral_logic(bot, session, partner)


async def get_partner_by_telegram_id(session: AsyncSession, telegram_id: str) -> Optional[Partner]:
    statement = select(Partner).where(Partner.telegram_id == telegram_id)
    result = await session.exec(statement)
    return result.first()

async def get_partner_by_referral_code(session: AsyncSession, code: str) -> Optional[Partner]:
    statement = select(Partner).where(Partner.referral_code == code)
    result = await session.exec(statement)
    return result.first()

async def process_referral_logic(bot, session: AsyncSession, partner: Partner):
    """
    Optimized 9-level referral logic.
    Tracks lineage, distributes XP, updates Redis leaderboards, and sends notifications.
    """
    if not partner.referrer_id:
        return

    # XP distribution configuration (XP per level)
    # L1: 35 XP, L2: 15 XP, L3: 10 XP, L4-L9: 5 XP
    XP_MAP = {1: 35, 2: 15, 3: 10, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5}
    
    current = partner
    for level in range(1, 10):
        if not current.referrer_id: break
        
        referrer = await session.get(Partner, current.referrer_id)
        if not referrer: break
        
        # 1. Distribute XP
        xp_gain = XP_MAP.get(level, 0)
        referrer.xp += xp_gain
        
        # 2. Handle Level Up Logic
        while referrer.xp >= referrer.level * 100:
            referrer.level += 1
            try:
                msg = f"🏆 *Level Up!* 🏆\n\nYou've reached *Level {referrer.level}*!\n\nKeep going to unlock the Platinum Tier."
                await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)
            except Exception: pass
            
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
            else:
                msg = get_msg(lang, "referral_deep_activity", level=level)
            await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)
        except Exception: pass

        session.add(referrer)
        current = referrer  # Move up the chain

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
    
    # Query: Count partners where path starts with base_path
    # We calculate level by counting dots in the path relative to base_path
    query = text("""
        SELECT 
            (length(path) - length(:base_path) - length(replace(substring(path from length(:base_path) + 1), '.', '')) + 1) as tree_level,
            COUNT(*) as count
        FROM partner
        WHERE path = :base_path OR path LIKE :base_path || '.%'
        GROUP BY tree_level
        HAVING (length(path) - length(:base_path) - length(replace(substring(path from length(:base_path) + 1), '.', '')) + 1) <= 9
        ORDER BY tree_level;
    """)
    
    result = await session.execute(query, {"base_path": base_path})
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
    target_dots = base_dots + target_level
    
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

async def migrate_paths(session: AsyncSession):
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
