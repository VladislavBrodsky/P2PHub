import logging
from typing import Optional
from sqlmodel import select, Session
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine, get_session
from app.core.i18n import get_msg
import uuid

logger = logging.getLogger(__name__)

async def get_partner_by_telegram_id(session: AsyncSession, telegram_id: str) -> Optional[Partner]:
    statement = select(Partner).where(Partner.telegram_id == telegram_id)
    result = await session.exec(statement)
    return result.first()

async def get_partner_by_referral_code(session: AsyncSession, code: str) -> Optional[Partner]:
    statement = select(Partner).where(Partner.referral_code == code)
    result = await session.exec(statement)
    return result.first()

async def create_partner(
    session: AsyncSession, 
    telegram_id: str, 
    username: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    language_code: Optional[str] = "en",
    referrer_code: Optional[str] = None
) -> tuple[Partner, bool]:
    # 1. Check if already exists
    partner = await get_partner_by_telegram_id(session, telegram_id)
    if partner:
        # Update language code if it changed
        if language_code and partner.language_code != language_code:
            partner.language_code = language_code
            session.add(partner)
            await session.commit()
            await session.refresh(partner)
        return partner, False

    # 2. Handle referrer
    referrer_id = None
    if referrer_code:
        referrer = await get_partner_by_referral_code(session, referrer_code)
        if referrer:
            referrer_id = referrer.id
            logger.info(f"Linking new partner {telegram_id} to referrer {referrer.telegram_id}")

    # 3. Create new partner
    new_code = f"P{telegram_id}"
    
    partner = Partner(
        telegram_id=telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name,
        language_code=language_code or "en",
        referral_code=new_code,
        referrer_id=referrer_id,
        xp=0,
        balance=0
    )
    
    session.add(partner)
    await session.commit()
    await session.refresh(partner)
    
    return partner, True

async def process_referral_notifications(bot, session: AsyncSession, partner: Partner, is_new: bool):
    """
    Handles multi-level notifications up to 9 levels deep.
    Only triggered for new partners who joined via a referral link.
    """
    if not is_new or not partner.referrer_id:
        return

    current_partner = partner
    levels = 9

    for level in range(1, levels + 1):
        if not current_partner.referrer_id:
            break
            
        referrer = await session.get(Partner, current_partner.referrer_id)
        if not referrer:
            break

        # Send notification
        try:
            lang = referrer.language_code or "en"
            if level == 1:
                # Congratulations Message for L1
                name = partner.first_name or partner.username or "Partner"
                username_str = f" (@{partner.username})" if partner.username else ""
                msg = get_msg(
                    lang, 
                    "referral_l1_congrats", 
                    name=name, 
                    username=username_str
                )
                # Credit XP
                referrer.xp += 35
                
                # Check for Level Up
                # Formula: Next Level Threshold = Current Level * 100
                leveled_up = False
                while referrer.xp >= referrer.level * 100:
                    referrer.level += 1
                    leveled_up = True
                
                session.add(referrer)
                await session.commit()
                await session.refresh(referrer)
                
                if leveled_up:
                    try:
                        levelup_msg = f"🏆 *Level Up!* 🚀\n\nYou've reached *Level {referrer.level}*!\nKeep growing your network to unlock more rewards."
                        await bot.send_message(
                            chat_id=int(referrer.telegram_id),
                            text=levelup_msg,
                            parse_mode="Markdown"
                        )
                    except Exception as e:
                        logger.error(f"Failed to send levelup msg: {e}")

            else:
                # Activity in referral line for L2-L9
                msg = get_msg(
                    lang, 
                    "referral_deep_activity", 
                    level=level
                )

            await bot.send_message(
                chat_id=int(referrer.telegram_id),
                text=msg,
                parse_mode="Markdown"
            )
        except Exception as e:
            logger.error(f"Failed to notify referrer {referrer.telegram_id} at level {level} in {lang}: {e}")

        # Move up the chain
        current_partner = referrer

async def get_referral_tree_stats(session: AsyncSession, partner_id: int, max_depth: int = 9) -> dict[int, int]:
    """
    Calculates the number of partners at each level of the referral tree.
    Returns a dict {level: count}.
    """
    stats = {i: 0 for i in range(1, max_depth + 1)}
    
    # We need to find all partners where referrer_id is in the previous level's IDs
    current_level_ids = [partner_id]
    
    for level in range(1, max_depth + 1):
        if not current_level_ids:
            break
            
        # Find all partners whose referrer_id is in current_level_ids
        statement = select(Partner.id).where(Partner.referrer_id.in_(current_level_ids))
        result = await session.exec(statement)
        next_level_ids = result.all()
        
        count = len(next_level_ids)
        if count == 0:
            break
            
        stats[level] = count
        current_level_ids = next_level_ids
        
    return stats
