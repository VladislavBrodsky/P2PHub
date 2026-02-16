import asyncio
import logging

import sentry_sdk
from app.core.config import settings
from app.core.i18n import get_msg
from app.models.partner import Earning, Partner, XPTransaction, engine
from app.services.audit_service import audit_service
from app.services.leaderboard_service import leaderboard_service
from app.services.notification_service import notification_service
from app.services.redis_service import redis_service
from app.utils.ranking import get_level
from app.utils.text import escape_markdown_v1
from app.worker import broker
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

logger = logging.getLogger(__name__)

# #comment: Background tasks tracking to prevent garbage collection (RUF006)
_background_tasks: set[asyncio.Task] = set()

async def process_referral_notifications(bot, session: AsyncSession, partner: Partner, is_new: bool):
    """
    Wrapper to trigger the recursive referral logic for new signups.
    """
    if is_new and partner.referrer_id:
        try:
            # #comment: CRITICAL FIX for Production (Audit Compliance)
            # Switch to Broker-backed execution (.kiq) to prevent task loss on container restart.
            # While create_task is faster, it risks data loss for critical referral logic.
            logger.info(f"🚀 Triggering referral logic via TaskIQ broker for partner {partner.id}")
            await process_referral_logic.kiq(partner.id)
        except Exception as e:
            logger.error(f"⚠️ Failed to trigger referral logic task: {e}")
            # Fallback only if broker fails completely
            task = asyncio.create_task(process_referral_logic(partner.id))
            _background_tasks.add(task)
            task.add_done_callback(_background_tasks.discard)

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
            if await _is_already_awarded(session, partner.id):
                logger.info(f"[INFO] Referral XP already awarded for partner {partner_id}. Skipping...")
                return

            logger.info(f"🔄 Processing referral logic for partner {partner_id} (@{partner.username}).")

            # 1. Resolve Ancestors chain (Bulk fetch)
            ancestor_map = await _get_ancestor_map(session, partner)
            
            # 2. Process Awards (9 Levels)
            xp_txs, deferred_tasks = await _process_referral_awards(session, partner, ancestor_map)
            
            # 3. Batch Commit & Finalize Notifications
            # We always commit if there are ancestor updates or deferred notification tasks
            if xp_txs or deferred_tasks:
                if xp_txs:
                    session.add_all(xp_txs)
                await session.commit()
                await _finalize_referral_logic(deferred_tasks)

    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"Error in process_referral_logic: {e}", exc_info=True)

async def _is_already_awarded(session: AsyncSession, partner_id: int) -> bool:
    check_stmt = select(XPTransaction).where(
        XPTransaction.reference_id == str(partner_id),
        XPTransaction.type.in_(["REFERRAL_L1", "REFERRAL_DEEP"])
    ).limit(1)
    return (await session.exec(check_stmt)).first() is not None

async def _get_ancestor_map(session: AsyncSession, partner: Partner) -> dict[int, Partner]:
    lineage_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
    if partner.referrer_id and partner.referrer_id not in lineage_ids:
        lineage_ids.append(partner.referrer_id)
    lineage_ids = list(dict.fromkeys(lineage_ids))[-9:]
    
    result = await session.exec(select(Partner).where(Partner.id.in_(lineage_ids)))
    return {p.id: p for p in result.all()}

async def _process_referral_awards(session: AsyncSession, partner: Partner, ancestor_map: dict[int, Partner]) -> tuple[list[XPTransaction], list]:
    xp_txs = []
    deferred_tasks = []
    current_referrer_id = partner.referrer_id
    chain_list = ["You"]
    new_partner_name = format_partner_name(partner)
    
    for level in range(1, 10):
        if not current_referrer_id: break
        referrer = ancestor_map.get(current_referrer_id)
        if not referrer: break

        try:
            # XP Calculation & Level Up
            xp_gain = _calculate_referral_xp(level, referrer.is_pro)
            xp_before = referrer.xp
            referrer.xp += xp_gain
            referrer.referral_count += 1
            
            xp_txs.append(XPTransaction(
                partner_id=referrer.id, amount=xp_gain,
                type="REFERRAL_L1" if level == 1 else "REFERRAL_DEEP",
                description=f"Referral XP Reward (L{level})", reference_id=str(partner.id)
            ))

            await audit_service.log_xp_award(
                session=session, partner_id=referrer.id, new_user_id=partner.id,
                xp_amount=xp_gain, level=level, is_pro=referrer.is_pro,
                xp_before=xp_before, xp_after=referrer.xp
            )

            await _check_level_up(referrer, deferred_tasks)
            await _stage_redis_invalidation(referrer, level)
            
            msg_task = _prepare_referral_notification(referrer, level, xp_gain, new_partner_name, chain_list)
            deferred_tasks.append(msg_task)

        except Exception as e:
            logger.error(f"❌ Failed level {level} for {referrer.id}: {e}")
        
        current_referrer_id = referrer.referrer_id
        session.add(referrer)

    return xp_txs, deferred_tasks

def _calculate_referral_xp(level: int, is_pro: bool) -> int:
    xp = settings.REFERRAL_XP_MAP.get(level, 0)
    return xp * settings.PRO_XP_MULTIPLIER if is_pro else xp

async def _check_level_up(referrer: Partner, deferred_tasks: list):
    new_level = get_level(referrer.xp)
    if new_level > referrer.level:
        deferred_tasks.append(notification_service.send_level_up_notification(
            chat_id=int(referrer.telegram_id), old_level=referrer.level,
            new_level=new_level, lang=referrer.language_code or "en"
        ))
        referrer.level = new_level

async def _stage_redis_invalidation(referrer: Partner, level: int):
    await leaderboard_service.update_score(referrer.id, referrer.xp)
    async with redis_service.client.pipeline(transaction=False) as pipe:
        pipe.delete(f"partner:profile:{referrer.telegram_id}")
        pipe.delete(f"partner:earnings:{referrer.telegram_id}")
        pipe.delete(f"ref_tree_stats_v2:{referrer.id}")
        pipe.delete(f"ref_tree_members_v2:{referrer.id}:{level}")
        for tf in ["24H", "7D", "1M", "3M", "6M", "1Y"]:
            pipe.delete(f"growth_metrics:{referrer.id}:{tf}")
        await pipe.execute()

def _prepare_referral_notification(referrer: Partner, level: int, xp: int, name: str, chain: list):
    chain_text = " ← ".join([*chain, name])
    chain.append(format_partner_name(referrer))
    lang = referrer.language_code or "en"
    buttons = [[
        {"text": "📊 View Network", "web_app": {"url": f"{settings.FRONTEND_URL}?start_param=network"}},
        {"text": "🚀 Open App", "web_app": {"url": settings.FRONTEND_URL}}
    ]]
    if level == 1: msg = get_msg(lang, "referral_l1_congrats", name=name, xp=xp)
    elif level == 2: msg = get_msg(lang, "referral_l2_congrats", referral_chain=chain_text, xp=xp)
    else: msg = get_msg(lang, "referral_deep_activity", level=level, referral_chain=chain_text, xp=xp)
    
    return notification_service.enqueue_notification(chat_id=int(referrer.telegram_id), text=msg, buttons=buttons)

async def _finalize_referral_logic(deferred_tasks: list):
    if deferred_tasks:
        await asyncio.gather(*deferred_tasks, return_exceptions=True)

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

    sentry_sdk.add_breadcrumb(
        category="commission",
        message=f"Distributing PRO commissions for partner {partner_id} (Amount: {total_amount})",
        level="info"
    )

    current_referrer_id = partner.referrer_id
    earnings_to_add = []
    redis_pipe = redis_service.client.pipeline(transaction=True)
    deferred_notifications = []

    for level in range(1, 10):
        if not current_referrer_id:
            break

        referrer = ancestor_map.get(current_referrer_id)
        if not referrer:
            break

        pct = settings.COMMISSION_MAP.get(level, 0)
        commission = total_amount * pct

        if commission > 0:
            # 1. Update Object State (In-Memory)
            balance_before = referrer.balance
            referrer.balance += commission
            referrer.total_earned_usdt += commission

            # 2. Record Earning
            earning = Earning(
                partner_id=referrer.id,
                amount=commission,
                description=f"PRO Commission (L{level})",
                type="COMMISSION",
                level=level,
                currency="USDT"
            )
            earnings_to_add.append(earning)

            # 3. Log Audit (No flush)
            await audit_service.log_commission(
                session=session,
                partner_id=referrer.id,
                buyer_id=partner.id,
                amount=commission,
                level=level,
                balance_before=balance_before,
                balance_after=referrer.balance,
            )

            # 4. Stage Redis Invalidation
            redis_pipe.delete(f"partner:profile:{referrer.telegram_id}")
            redis_pipe.delete(f"partner:earnings:{referrer.telegram_id}")

            # 5. Prepare Notification
            try:
                lang = referrer.language_code or "en"
                buttons = [[
                    {"text": "💰 Check Balance", "web_app": {"url": settings.FRONTEND_URL}},
                    {"text": "🚀 Open App", "web_app": {"url": settings.FRONTEND_URL}}
                ]]
                buyer_name = format_partner_name(partner)
                msg = get_msg(lang, "commission_received", amount=round(commission, 2), level=level, from_user=buyer_name)
                
                # Push to list for final parallel dispatch
                deferred_notifications.append(notification_service.enqueue_notification(
                    chat_id=int(referrer.telegram_id), 
                    text=msg,
                    buttons=buttons
                ))
            except Exception as e:
                logger.error(f"Failed to prepare notification for {referrer.id}: {e}")

            session.add(referrer) # Stage for bulk commit

        current_referrer_id = referrer.referrer_id
    
    # 6. Finalize Batch Changes
    if earnings_to_add:
        session.add_all(earnings_to_add)
        await session.commit()
        await redis_pipe.execute()
        
        # 7. Dispatch Notifications in parallel
        if deferred_notifications:
            await asyncio.gather(*deferred_notifications, return_exceptions=True)
