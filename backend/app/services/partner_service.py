import logging
from typing import Optional, List, Dict
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner
from app.core.i18n import get_msg
from app.services.leaderboard_service import leaderboard_service
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

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
