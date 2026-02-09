import secrets
import logging
from typing import Optional, List, Dict, Tuple
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner
from app.core.i18n import get_msg
from app.services.leaderboard_service import leaderboard_service
from app.services.redis_service import redis_service

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
    if referrer_code:
        try:
            ref_stmt = select(Partner).where(Partner.referral_code == referrer_code)
            ref_res = await session.exec(ref_stmt)
            referrer = ref_res.first()
            if referrer:
                referrer_id = referrer.id
        except Exception as e:
            logger.error(f"Error resolving referrer_code {referrer_code}: {e}")

    # 3. Create fresh partner
    partner = Partner(
        telegram_id=telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name,
        language_code=language_code,
        referral_code=f"P2P-{secrets.token_hex(4).upper()}",
        referrer_id=referrer_id
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
                msg = f"🏆 *Level Up!* 🚀\n\nYou've reached *Level {referrer.level}*!\nKeep growing your network to unlock more rewards."
                await bot.send_message(chat_id=int(referrer.telegram_id), text=msg, parse_mode="Markdown")
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
            await bot.send_message(chat_id=int(referrer.telegram_id), text=msg, parse_mode="Markdown")
        except Exception: pass

        session.add(referrer)
        current = referrer  # Move up the chain

    await session.commit()

async def get_referral_tree_stats(session: AsyncSession, partner_id: int) -> dict[int, int]:
    """
    Uses PostgreSQL Recursive CTE for ultra-fast 9-level tree counting.
    Cached in Redis to avoid repeat execution.
    """
    cache_key = f"ref_tree_stats:{partner_id}"
    cached = await redis_service.get_json(cache_key)
    if cached: return {int(k): v for k, v in cached.items()}

    # Recursive CTE Query
    query = text("""
        WITH RECURSIVE referral_tree AS (
            -- Base case: Level 1 partners
            SELECT id, referrer_id, 1 as level
            FROM partner
            WHERE referrer_id = :partner_id
            
            UNION ALL
            
            -- Recursive step: Join with next level
            SELECT p.id, p.referrer_id, rt.level + 1
            FROM partner p
            JOIN referral_tree rt ON p.referrer_id = rt.id
            WHERE rt.level < 9
        )
        SELECT level, COUNT(*) as count
        FROM referral_tree
        GROUP BY level
        ORDER BY level;
    """)
    
    result = await session.execute(query, {"partner_id": partner_id})
    stats = {i: 0 for i in range(1, 10)}
    for row in result:
        stats[row[0]] = row[1]
        
    await redis_service.set_json(cache_key, stats, expire=300)
    return stats

async def get_referral_tree_members(session: AsyncSession, partner_id: int, target_level: int) -> List[dict]:
    """
    Fetches details of partners at a specific level in the 9-level matrix using Recursive CTE.
    """
    if not (1 <= target_level <= 9):
        return []

    query = text("""
        WITH RECURSIVE referral_tree AS (
            -- Base case: Level 1
            SELECT id, telegram_id, username, first_name, last_name, xp, photo_url, 1 as level, created_at
            FROM partner
            WHERE referrer_id = :partner_id
            
            UNION ALL
            
            -- Recursive step
            SELECT p.id, p.telegram_id, p.username, p.first_name, p.last_name, p.xp, p.photo_url, rt.level + 1, p.created_at
            FROM partner p
            JOIN referral_tree rt ON p.referrer_id = rt.id
            WHERE rt.level < :target_level
        )
        SELECT telegram_id, username, first_name, last_name, xp, photo_url, created_at
        FROM referral_tree
        WHERE level = :target_level
        ORDER BY xp DESC
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
                "joined_at": row[6].isoformat() if row[6] else None
            })
        return members
    except Exception as e:
        logger.error(f"Error fetching tree members: {e}")
        return []
