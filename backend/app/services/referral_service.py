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
from app.utils.ranking import get_level
from app.worker import broker

logger = logging.getLogger(__name__)

async def process_referral_notifications(bot, session: AsyncSession, partner: Partner, is_new: bool):
    """
    Wrapper to trigger the recursive referral logic for new signups.
    """
    if is_new and partner.referrer_id:
        # Run logic in background via TaskIQ worker
        await process_referral_logic.kiq(partner.id)
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

            # reconstruct lineage (L1 to L9)
            lineage_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
            if partner.referrer_id:
                lineage_ids.append(partner.referrer_id)
            lineage_ids = lineage_ids[-9:]

            # Bulk Fetch all ancestors
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
                    # XP Distribution
                    xp_gain = XP_MAP.get(level, 0)
                    if referrer.is_pro:
                        xp_gain *= 5  # PRO members get 5x XP bonus

                    # ATOMIC SQL INCREMENT
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

                    xp_earning = Earning(
                        partner_id=referrer.id,
                        amount=xp_gain,
                        description=f"Referral XP Reward (L{level})",
                        type="REFERRAL_XP",
                        level=level,
                        created_at=datetime.utcnow()
                    )
                    session.add(xp_earning)

                    # Audit logging
                    from app.services.audit_service import audit_service
                    await audit_service.log_xp_award(
                        session=session,
                        partner_id=referrer.id,
                        new_user_id=partner.id,
                        xp_amount=xp_gain,
                        level=level,
                        is_pro=referrer.is_pro,
                        xp_before=referrer.xp,
                        xp_after=referrer.xp + xp_gain,
                    )

                    await session.flush()
                    await session.refresh(referrer)
                    logger.info(f"💰 [Level {level}] XP Awarded: {xp_gain} to {referrer.id}")

                except Exception as core_error:
                    logger.critical(f"❌ CRITICAL: Failed to award XP for {referrer.id} at level {level}: {core_error}")
                    current_referrer_id = referrer.referrer_id
                    continue

                # Level Up Side Effect
                try:
                    new_level = get_level(referrer.xp)
                    if new_level > referrer.level:
                        for lvl in range(referrer.level + 1, new_level + 1):
                            try:
                                lang = referrer.language_code or "en"
                                msg = get_msg(lang, "level_up", level=lvl)
                                await notification_service.enqueue_notification(chat_id=referrer.telegram_id, text=msg)

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
                                            await notification_service.enqueue_notification(chat_id=admin_id, text=admin_msg)
                                        except Exception: pass
                            except Exception: pass
                        referrer.level = new_level
                except Exception as e:
                    logger.error(f"⚠️ Level up logic failed for {referrer.id}: {e}")

                # Redis Side Effects
                try:
                    await leaderboard_service.update_score(referrer.id, referrer.xp)
                    async with redis_service.client.pipeline(transaction=True) as pipe:
                        pipe.delete(f"partner:profile:{referrer.telegram_id}")
                        pipe.delete(f"ref_tree_stats:{referrer.id}")
                        if level == 1:
                            pipe.delete(f"ref_tree_members:{referrer.id}:1")
                        await pipe.execute()
                except Exception as e:
                    logger.error(f"⚠️ Redis sync/invalidation failed for {referrer.id}: {e}")

                # Referral Notifications
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
                        await notification_service.enqueue_notification(chat_id=referrer.telegram_id, text=msg)
                except Exception as e:
                    logger.error(f"⚠️ Notification failed for {referrer.id}: {e}")

                current_referrer_id = referrer.referrer_id

            await session.commit()

    except Exception as e:
        logger.error(f"Error in process_referral_logic: {e}", exc_info=True)

async def distribute_pro_commissions(session: AsyncSession, partner_id: int, total_amount: float):
    """
    Distributes commissions for PRO subscription purchase across 9 levels.
    """
    partner = await session.get(Partner, partner_id)
    if not partner or not partner.referrer_id:
        return

    COMMISSION_PCT = {1: 0.30, 2: 0.05, 3: 0.03, 4: 0.01, 5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01}
    path_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
    lineage_ids = (path_ids + [partner.referrer_id])[-9:]

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
            await session.execute(
                text("UPDATE partner SET balance = balance + :comm, total_earned_usdt = total_earned_usdt + :comm WHERE id = :p_id"),
                {"comm": commission, "p_id": referrer.id}
            )

            earning = Earning(
                partner_id=referrer.id,
                amount=commission,
                description=f"PRO Commission (L{level})",
                type="PRO_COMMISSION",
                level=level,
                currency="USDT"
            )
            session.add(earning)

            from app.services.audit_service import audit_service
            await audit_service.log_commission(
                session=session,
                partner_id=referrer.id,
                buyer_id=partner.id,
                amount=commission,
                level=level,
                balance_before=referrer.balance,
                balance_after=referrer.balance + commission,
            )

            await session.refresh(referrer)

            async with redis_service.client.pipeline(transaction=True) as pipe:
                pipe.delete(f"partner:profile:{referrer.telegram_id}")
                pipe.delete(f"partner:earnings:{referrer.telegram_id}")
                await pipe.execute()

            try:
                lang = referrer.language_code or "en"
                msg = get_msg(lang, "commission_received", amount=round(commission, 2), level=level)
                await notification_service.enqueue_notification(chat_id=referrer.telegram_id, text=msg)
            except Exception: pass

        current_referrer_id = referrer.referrer_id
