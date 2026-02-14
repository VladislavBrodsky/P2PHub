import asyncio
import logging
from datetime import datetime
from typing import List, Optional

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.i18n import get_msg
from app.models.partner import Partner, XPTransaction, Earning, engine
from app.services.leaderboard_service import leaderboard_service
from app.services.notification_service import notification_service
from app.services.redis_service import redis_service
from app.services.audit_service import audit_service
from app.utils.ranking import get_level
from app.utils.text import escape_markdown_v1
from app.worker import broker

logger = logging.getLogger(__name__)

async def process_referral_notifications(bot, session: AsyncSession, partner: Partner, is_new: bool):
    """
    Wrapper to trigger the recursive referral logic for new signups.
    """
    if is_new and partner.referrer_id:
        try:
            # Run logic in background via TaskIQ worker
            await process_referral_logic.kiq(partner.id)
            logger.info(f"🚀 Referral logic task enqueued for partner {partner.id}")
        except Exception as e:
            logger.error(f"⚠️ Failed to enqueue referral logic task: {e}")
            # Fallback: Run it in the current process (but non-blocking if possible)
            # Since we are in an async context, we can just await it directly
            # This is safer than losing the referral data.
            logger.info(f"🔄 Running referral logic in fallback mode for partner {partner.id}")
            asyncio.create_task(process_referral_logic(partner.id))

def format_partner_name(p: Partner) -> str:
    """Construct Full Name: First Last (@username)"""
    parts = []
    if p.first_name:
        parts.append(p.first_name)
    if p.last_name:
        parts.append(p.last_name)
    
    name_display = " ".join(parts) if parts else "Partner"
    
    if p.username:
        name_display += f" (@{p.username})"
    
    return escape_markdown_v1(name_display)

@broker.task(retry=3)
async def process_referral_logic(partner_id: int):
    """
    Optimized 9-level referral logic.
    Run as a TaskIQ background task.
    """
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            partner = await session.get(Partner, partner_id)
            if not partner or not partner.referrer_id:
                return

            # 0. Idempotency Check: Prevent double-awarding XP if task is retried
            check_stmt = select(XPTransaction).where(
                XPTransaction.reference_id == str(partner.id),
                XPTransaction.type.in_(["REFERRAL_L1", "REFERRAL_DEEP"])
            ).limit(1)
            existing_reward = (await session.exec(check_stmt)).first()
            if existing_reward:
                logger.info(f"ℹ️ Referral XP already awarded for partner {partner_id}. Skipping...")
                return

            # Bulk Fetch all ancestors
            lineage_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
            lineage_ids = list(dict.fromkeys(lineage_ids))[-9:]
            
            statement = select(Partner).where(Partner.id.in_(lineage_ids))
            result = await session.exec(statement)
            ancestor_list = result.all()
            ancestor_map = {p.id: p for p in ancestor_list}

            logger.info(f"🔄 Processing referral logic for partner {partner_id} (@{partner.username}).")

            new_partner_name = format_partner_name(partner)
            current_referrer_id = partner.referrer_id
            
            # Batch Redis Invalidation & Task Management
            redis_pipe = redis_service.client.pipeline(transaction=True)
            deferred_tasks = []

            # Prepare referral chain text for level 2+
            # Chain looks like: You <- Referrer 1 <- Referrer 2 ... <- New Joiner
            chain_list = ["You"]
            
            for level in range(1, 10):
                if not current_referrer_id:
                    break

                referrer = ancestor_map.get(current_referrer_id)
                if not referrer:
                    logger.warning(f"⚠️ Ancestor {current_referrer_id} not found in map for partner {partner_id} at level {level}")
                    break

                try:
                    # 1. Award XP
                    xp_gain = settings.REFERRAL_XP_MAP.get(level, 0)
                    if referrer.is_pro:
                        xp_gain *= settings.PRO_XP_MULTIPLIER

                    xp_before = referrer.xp

                    await session.execute(
                        text("UPDATE partner SET xp = xp + :gain, referral_count = referral_count + 1 WHERE id = :p_id"),
                        {"gain": xp_gain, "p_id": referrer.id}
                    )
                    await session.flush()
                    await session.refresh(referrer)

                    xp_tx = XPTransaction(
                        partner_id=referrer.id,
                        amount=xp_gain,
                        type="REFERRAL_L1" if level == 1 else "REFERRAL_DEEP",
                        description=f"Referral XP Reward (L{level})",
                        reference_id=str(partner.id)
                    )
                    session.add(xp_tx)

                    # 2. Audit & Notification Data
                    await audit_service.log_xp_award(
                        session=session,
                        partner_id=referrer.id,
                        new_user_id=partner.id,
                        xp_amount=xp_gain,
                        level=level,
                        is_pro=referrer.is_pro,
                        xp_before=xp_before,
                        xp_after=referrer.xp,
                    )

                    # 3. Level Up Logic
                    new_level = get_level(referrer.xp)
                    if new_level > referrer.level:
                        deferred_tasks.append(
                            notification_service.send_level_up_notification(
                                chat_id=int(referrer.telegram_id),
                                old_level=referrer.level,
                                new_level=new_level,
                                lang=referrer.language_code or "en"
                            )
                        )
                        referrer.level = new_level
                        session.add(referrer)

                    # 4. Queue Redis Invalidation
                    await leaderboard_service.update_score(referrer.id, referrer.xp)
                    redis_pipe.delete(f"partner:profile:{referrer.telegram_id}")
                    redis_pipe.delete(f"partner:earnings:{referrer.telegram_id}")
                    redis_pipe.delete(f"ref_tree_stats_v2:{referrer.id}")
                    # Clear member lists for the affected level
                    redis_pipe.delete(f"ref_tree_members_v2:{referrer.id}:{level}")
                    for tf in ["24H", "7D", "1M", "3M", "6M", "1Y"]:
                        redis_pipe.delete(f"growth_metrics:{referrer.id}:{tf}")
                    
                    # 5. Build Referral Chain for deeper levels
                    # Chain: You <- Ref A <- Ref B ... <- New User
                    # For Ref A (L1), they just see New User.
                    # For Ref B (L2), they see You (Ref B) <- Ref A <- New User.
                    chain_text = " ← ".join(chain_list + [new_partner_name])
                    chain_list.append(format_partner_name(referrer))

                    # 6. Queue Notification with CORRECT Keys
                    lang = referrer.language_code or "en"
                    if level == 1:
                        msg = get_msg(lang, "referral_l1_congrats", name=new_partner_name, xp=xp_gain)
                    elif level == 2:
                        msg = get_msg(lang, "referral_l2_congrats", referral_chain=chain_text, xp=xp_gain)
                    else:
                        msg = get_msg(lang, "referral_deep_activity", level=level, referral_chain=chain_text, xp=xp_gain)
                    
                    deferred_tasks.append(notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg))

                except Exception as core_error:
                    logger.error(f"❌ Failed level {level} rewards for {referrer.id}: {core_error}")
                
                current_referrer_id = referrer.referrer_id

            await session.commit()
            await redis_pipe.execute()
            await asyncio.gather(*deferred_tasks, return_exceptions=True)

    except Exception as e:
        logger.error(f"Error in process_referral_logic: {e}", exc_info=True)

async def distribute_pro_commissions(session: AsyncSession, partner_id: int, total_amount: float):
    """
    Distributes commissions for PRO subscription purchase across 9 levels.
    """
    partner = await session.get(Partner, partner_id)
    if not partner or not partner.referrer_id:
        return

    # Path already includes ancestors, just deduplicate and fetch
    lineage_ids = list(dict.fromkeys([int(x) for x in partner.path.split('.')] if partner.path else []))[-9:]

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

        pct = settings.COMMISSION_MAP.get(level, 0)
        commission = total_amount * pct

        if commission > 0:
            # Capture state for audit
            balance_before = referrer.balance

            await session.execute(
                text("UPDATE partner SET balance = balance + :comm, total_earned_usdt = total_earned_usdt + :comm WHERE id = :p_id"),
                {"comm": commission, "p_id": referrer.id}
            )

            # Refresh to get updated balance
            await session.flush()
            await session.refresh(referrer)

            earning = Earning(
                partner_id=referrer.id,
                amount=commission,
                description=f"PRO Commission (L{level})",
                type="COMMISSION",
                level=level,
                currency="USDT"
            )
            session.add(earning)

            await audit_service.log_commission(
                session=session,
                partner_id=referrer.id,
                buyer_id=partner.id,
                amount=commission,
                level=level,
                balance_before=balance_before,
                balance_after=referrer.balance,
            )

            # Batch Redis Invalidation
            async with redis_service.client.pipeline(transaction=True) as pipe:
                pipe.delete(f"partner:profile:{referrer.telegram_id}")
                pipe.delete(f"partner:earnings:{referrer.telegram_id}")
                await pipe.execute()

            try:
                lang = referrer.language_code or "en"
                # Fixed: Use CORRECT key from i18n.py (commission_received)
                buyer_name = format_partner_name(partner)
                msg = get_msg(lang, "commission_received", amount=round(commission, 2), level=level, from_user=buyer_name)
                await notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg)
            except Exception as e:
                logger.error(f"Failed to notify {referrer.id} about commission: {e}")

        current_referrer_id = referrer.referrer_id
