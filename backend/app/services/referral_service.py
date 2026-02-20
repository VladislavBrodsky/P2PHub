import asyncio
import logging

import sentry_sdk
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.broker import broker
from app.core.config import settings
from app.core.i18n import get_msg
from app.core.retry import async_retry
from app.models.partner import Earning, Partner, XPTransaction, engine
from app.services.audit_service import audit_service
from app.services.leaderboard_service import leaderboard_service
from app.services.notification_service import notification_service
from app.services.redis_service import redis_service
from app.utils.ranking import get_level
from app.utils.text import escape_markdown_v1

logger = logging.getLogger(__name__)

# #comment: Background tasks tracking to prevent garbage collection (RUF006)
_background_tasks: set[asyncio.Task] = set()


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
    Optimized 20-level referral logic.
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
            
            # 2. Process Awards (20 Levels)
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
        XPTransaction.type.in_(["REFERRAL_L1", "REFERRAL_DEEP", "REFERRAL_SIGNUP"])
    ).limit(1)
    return (await session.exec(check_stmt)).first() is not None

async def _get_ancestor_map(session: AsyncSession, partner: Partner) -> dict[int, Partner]:
    lineage_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
    if partner.referrer_id and partner.referrer_id not in lineage_ids:
        lineage_ids.append(partner.referrer_id)
    lineage_ids = list(dict.fromkeys(lineage_ids))[-20:]
    
    result = await session.exec(select(Partner).where(Partner.id.in_(lineage_ids)))
    return {p.id: p for p in result.all()}

async def _process_referral_awards(session: AsyncSession, partner: Partner, ancestor_map: dict[int, Partner]) -> tuple[list[XPTransaction], list]:
    xp_txs = []
    deferred_tasks = []
    current_referrer_id = partner.referrer_id
    chain_list = ["You"]
    new_partner_name = format_partner_name(partner)
    
    for level in range(1, 21):
        if not current_referrer_id: break
        referrer = ancestor_map.get(current_referrer_id)
        if not referrer: break

        # #comment: Network Growth Tracking (Milestone logic)
        # We increment referral_count for ALL levels to ensure "Network Size" stats 
        # are accurate and tasks can be completed.
        # However, L1 is now incremented synchronously in partner_service.create_partner
        # to ensure immediate feedback for "Invite 1 friend" tasks.
        if level > 1:
            referrer.referral_count = Partner.referral_count + 1
            session.add(referrer)

        # #comment: ELITE COMPRESSION LOGIC (XP Rewards)
        # Free users get rewards up to Level 3. 
        # L4-L9 require Standard PRO.
        # L10-L20 require PRO+ exclusively.
        qualified = False
        if level <= 3:
            qualified = True
        elif level <= 9:
            qualified = referrer.is_pro
        else:
            qualified = (referrer.subscription_plan == "PRO_PLUS_MONTHLY")

        if not qualified:
            # Send FOMO notification for rewards beyond current plan capability
            if level in [4, 10]:
                lang = referrer.language_code or "en"
                fomo_msg = get_msg(lang, "pro_fomo_missed", level=level)
                btn_text = get_msg(lang, "btn_upgrade")
                buttons = [[{"text": btn_text, "web_app": {"url": settings.FRONTEND_URL}}]]
                await notification_service.send_critical(
                    chat_id=int(referrer.telegram_id), text=fomo_msg, buttons=buttons
                )
            
            current_referrer_id = referrer.referrer_id
            continue

        try:
            # XP Calculation & Level Up
            xp_gain = _calculate_referral_xp(level, referrer)
            xp_before = float(referrer.xp)
            xp_after = xp_before + xp_gain
            
            # #comment: Atomic Increment for high-concurrency safety
            referrer.xp = Partner.xp + xp_gain
            
            xp_txs.append(XPTransaction(
                partner_id=referrer.id, amount=xp_gain,
                type="REFERRAL_SIGNUP",
                description=f"Referral Partner Joined (L{level})", reference_id=str(partner.id)
            ))

            # 1.3 Unified Transaction: Log Referral XP as an Earning
            from app.models.partner import Earning
            session.add(Earning(
                partner_id=referrer.id,
                amount=xp_gain,
                description=f"Referral Reward: {new_partner_name} (L{level})",
                type="REFERRAL_XP",
                currency="XP"
            ))

            # Log Audit
            await audit_service.log_xp_award(
                session=session, partner_id=referrer.id, new_user_id=partner.id,
                xp_amount=xp_gain, level=level, is_pro=referrer.is_pro,
                xp_before=xp_before, xp_after=xp_after
            )

            try:
                await _check_level_up(referrer, deferred_tasks, xp_after)
            except Exception as e_lvl:
                logger.error(f"Level up check failed for {referrer.id}: {e_lvl}")

            try:
                await _stage_redis_invalidation(referrer, level, xp_gain=xp_gain)
            except Exception as e_redis:
                logger.error(f"Redis invalidation failed for {referrer.id}: {e_redis}")
            
            msg_task = _prepare_referral_notification(referrer, level, xp_gain, new_partner_name, chain_list)
            deferred_tasks.append(msg_task)

        except Exception as e:
            logger.error(f"❌ Failed level {level} for {referrer.id}: {e}")
        
        current_referrer_id = referrer.referrer_id
        session.add(referrer)

    return xp_txs, deferred_tasks

def _calculate_referral_xp(level: int, partner: Partner) -> float:
    """
    XP per referral level by plan:
      Free  → flat 35 XP (for qualified levels L1-L3)
      PRO   → REFERRAL_XP_MAP[level] × 1.5
      PRO+  → REFERRAL_XP_MAP[level] × 3.0
    """
    if partner.is_pro_plus:
        return settings.REFERRAL_XP_MAP.get(level, 0) * settings.PRO_PLUS_XP_MULTIPLIER
    if partner.is_pro:
        return settings.REFERRAL_XP_MAP.get(level, 0) * settings.PRO_XP_MULTIPLIER
    # Free users: flat bonus regardless of level (qualification gate in _process_referral_awards)
    return settings.FREE_REFERRAL_XP

async def _check_level_up(referrer: Partner, deferred_tasks: list, current_xp: float):
    new_level = get_level(current_xp)
    if new_level > referrer.level:
        deferred_tasks.append(notification_service.send_level_up_notification(
            chat_id=int(referrer.telegram_id), old_level=referrer.level,
            new_level=new_level, lang=referrer.language_code or "en"
        ))
        referrer.level = new_level

async def _stage_redis_invalidation(referrer: Partner, level: int, xp_gain: float = 0.0, pipe=None):
    """
    Stages Redis cache invalidation for a partner.
    #comment Phase 2 Scaling: Added support for external pipeline to batch 20+ invalidations into 1 RTT.
    """
    if xp_gain > 0:
        await leaderboard_service.increment_score(referrer.id, xp_gain)

    # Use existing pipe or create a one-off
    p = pipe if pipe is not None else redis_service.client.pipeline(transaction=False)
    
    try:
        # Standard Profile Cache (v2 Legacy & v3 High-Perf)
        p.delete(f"partner:profile:{referrer.telegram_id}")
        p.delete(f"profile_cache_v3:{referrer.id}")
        
        p.delete(f"partner:earnings:{referrer.telegram_id}")
        p.delete(f"ref_tree_stats_v2:{referrer.id}")
        p.delete(f"ref_tree_members_v2:{referrer.id}:{level}")
        
        for tf in ["24H", "7D", "1M", "3M", "6M", "1Y"]:
            p.delete(f"growth_metrics:{referrer.id}:{tf}")
            
        if pipe is None:
            await p.execute()
    finally:
        if pipe is None:
            await p.close()

def _prepare_referral_notification(referrer: Partner, level: int, xp: int, name: str, chain: list):
    chain_text = " ← ".join([*chain, name])
    chain.append(format_partner_name(referrer))
    lang = referrer.language_code or "en"
    buttons = [[
        {"text": get_msg(lang, "btn_view_network"), "web_app": {"url": f"{settings.FRONTEND_URL}?start_param=network"}},
        {"text": get_msg(lang, "btn_open_app"), "web_app": {"url": settings.FRONTEND_URL}}
    ]]
    if level == 1: msg = get_msg(lang, "referral_l1_congrats", name=name, xp=xp)
    elif level == 2: msg = get_msg(lang, "referral_l2_congrats", referral_chain=chain_text, xp=xp)
    else: msg = get_msg(lang, "referral_deep_activity", level=level, referral_chain=chain_text, xp=xp)
    
    return notification_service.send_low_prio(chat_id=int(referrer.telegram_id), text=msg, buttons=buttons)

async def _finalize_referral_logic(deferred_tasks: list):
    if deferred_tasks:
        await asyncio.gather(*deferred_tasks, return_exceptions=True)

@async_retry(max_attempts=3, base_delay=1.0)
async def distribute_pro_commissions(session: AsyncSession, partner_id: int, total_amount: float, plan_type: str | None = None):
    """
    Distributes commissions for PRO ($39) or PRO+ ($69) subscription purchase.
    Implements DYNAMIC COMPRESSION: If an intermediary is not PRO, the commission 
    jumps to the next qualified upline leader.
    """
    partner = await session.get(Partner, partner_id)
    if not partner or not partner.referrer_id:
        return

    # Determine Model: PRO ($39) or PRO+ ($69)
    # Use plan_type if provided, else fallback to amount-based detection
    if plan_type:
        is_pro_plus_purchase = "PRO_PLUS" in plan_type
    else:
        is_pro_plus_purchase = total_amount >= (settings.PRO_PLUS_PRICE_USD - 0.1)
    
    comm_map = settings.COMMISSION_MAP_EMPIRE
    _max_recipients = 20

    # Resolve ALL Ancestors for compression logic
    # partner.path contains ancestors from root down to direct referrer.
    path_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
    lineage_ids = path_ids + [partner.referrer_id] if partner.referrer_id else path_ids
    lineage_ids = list(dict.fromkeys(lineage_ids))
    
    # Fetch all ancestors in bulk
    statement = select(Partner).where(Partner.id.in_(lineage_ids))
    result = await session.exec(statement)
    ancestor_map = {p.id: p for p in result.all()}

    # --- ELITE DYNAMIC COMPRESSION MODEL ---
    # Goal: Award each commission slice (L1-L20) to the NEXT qualified upline leader.
    # If a partner is not qualified for their expected level, we skip them and 
    # look for the next person in the lineage who is.
    
    stmt_admin = select(Partner).where(Partner.telegram_id == "537873096")
    res_admin = await session.exec(stmt_admin)
    company_account = res_admin.first()

    ancestors_at_dist = list(reversed(lineage_ids))
    balance_cache: dict[int, float] = {}
    xp_cache: dict[int, float] = {}
    all_recipients_for_cache = list(ancestor_map.values())
    if company_account:
        all_recipients_for_cache.append(company_account)
        
    for p in all_recipients_for_cache:
        try:
            balance_cache[p.id] = float(p.balance)
        except Exception:
            balance_cache[p.id] = 0.0
        try:
            xp_cache[p.id] = float(p.xp)
        except Exception:
            xp_cache[p.id] = 0.0

    earnings_to_add = []
    deferred_notifications = []
    notified_fomo = set()
    
    # Pointer for the current ancestor being evaluated
    curr_lineage_idx = 0
    buyer_name = format_partner_name(partner)

    async with redis_service.client.pipeline(transaction=False) as redis_pipe:
        # Loop through each commission level (slice of the pie)
        for comm_level in range(1, 21):
            pct = comm_map.get(comm_level, 0)
            if pct <= 0: continue
            
            commission = round(total_amount * pct, 4)
            recipient = None
            found_qualified_partner = False
            first_skipped_partner = None
            
            # Find the NEXT available partner in the chain who qualifies for this level
            while curr_lineage_idx < len(ancestors_at_dist):
                referrer_id = ancestors_at_dist[curr_lineage_idx]
                referrer = ancestor_map.get(referrer_id)
                curr_lineage_idx += 1
                
                if not referrer: continue
                
                # Qualification Check
                is_ref_pro_plus = (referrer.subscription_plan == "PRO_PLUS_MONTHLY")
                is_ref_pro = referrer.is_pro or (referrer.subscription_plan == "PRO_MONTHLY")
                
                qualified = False
                if comm_level <= 3:
                    qualified = True # Free users get up to Level 3
                elif comm_level <= 9:
                    qualified = (is_ref_pro or is_ref_pro_plus)
                else:
                    qualified = is_ref_pro_plus # L10-L20 requires PRO+
                
                if qualified:
                    recipient = referrer
                    found_qualified_partner = True
                    break
                else:
                    # Capture the first person who misses this slice for the audit log
                    if not first_skipped_partner:
                        first_skipped_partner = referrer
                    
                    # FOMO Notification (once per upgrade)
                    if referrer.id not in notified_fomo:
                        notified_fomo.add(referrer.id)
                        lang = referrer.language_code or "en"
                        fomo_msg = get_msg(lang, "commission_fomo_missed", amount=round(commission, 2), level=comm_level)
                        btn_text = get_msg(lang, "btn_upgrade")
                        deferred_notifications.append(notification_service.send_critical(
                            chat_id=int(referrer.telegram_id), text=fomo_msg,
                            buttons=[[{"text": btn_text, "web_app": {"url": settings.FRONTEND_URL}}]]
                        ))
            
            # If no more qualified partners in lineage, commission leaks to Company
            if not recipient:
                recipient = company_account
                
            if not recipient: continue # Should not happen if company_account is set

            # Award commission
            balance_before = balance_cache.get(recipient.id, 0.0)
            balance_after = round(balance_before + commission, 4)
            balance_cache[recipient.id] = balance_after
            
            recipient.balance = Partner.balance + commission
            recipient.total_earned_usdt = Partner.total_earned_usdt + commission
            
            # --- XP COMMISSION FOR ACTIVE REFERRAL ---
            # #comment Phase 2 Scaling: Use xp_cache to allow the same recipient (e.g. Admin) 
            # to receive multiple commission slices in one purchase without BinaryExpression errors.
            from app.services.audit_service import audit_service
            xp_gain = _calculate_referral_xp(comm_level, recipient)
            xp_before = xp_cache.get(recipient.id, 0.0)
            xp_after = xp_before + xp_gain
            xp_cache[recipient.id] = xp_after

            recipient.xp = Partner.xp + xp_gain
            
            session.add(recipient)
            
            description = f"{'PRO+' if is_pro_plus_purchase else 'PRO'} Commission (L{comm_level})"
            if not found_qualified_partner:
                skipped_info = f" (Skipped {first_skipped_partner.telegram_id})" if first_skipped_partner else f" (from {partner.telegram_id})"
                description = f"Missed Tree Revenue: Compression Leakage (L{comm_level}{skipped_info})"
                
            earnings_to_add.append(Earning(
                partner_id=recipient.id,
                amount=commission,
                description=description,
                type="COMMISSION",
                level=comm_level,
                currency="USDT",
                reference_id=f"upg_{partner.id}_{comm_level}"
            ))
            
            # Record XP Earning & Transaction for History
            earnings_to_add.append(Earning(
                partner_id=recipient.id,
                amount=xp_gain,
                description=f"Active Referral: {buyer_name} (L{comm_level})",
                type="REFERRAL_XP",
                currency="XP"
            ))
            
            from app.models.partner import XPTransaction
            session.add(XPTransaction(
                partner_id=recipient.id, amount=xp_gain,
                type="ACTIVE_REFERRAL",
                description=f"Active Referral XP (L{comm_level})",
                reference_id=f"upg_xp_{partner.id}_{comm_level}"
            ))

            # Audit & Notify
            try:
                await audit_service.log_commission(
                    session=session, partner_id=recipient.id, buyer_id=partner.id,
                    amount=commission, level=comm_level,
                    balance_before=balance_before, balance_after=balance_after,
                )
            except Exception as e:
                logger.error(f"Audit log_commission error for {recipient.id}: {e}")

            try:
                await audit_service.log_xp_award(
                    session=session, partner_id=recipient.id, buyer_id=partner.id,
                    xp_amount=xp_gain, level=comm_level, is_pro=recipient.is_pro,
                    xp_before=xp_before, xp_after=xp_after
                )
            except Exception as e:
                logger.error(f"Audit log_xp_award error for {recipient.id}: {e}")

            try:
                await _check_level_up(recipient, deferred_notifications, xp_after)
            except Exception as e:
                logger.error(f"Level up check error for {recipient.id}: {e}")

            # Stage Redis Invalidation (Leaderboard, Profile, Earnings)
            try:
                await _stage_redis_invalidation(recipient, comm_level, xp_gain=xp_gain, pipe=redis_pipe)
            except Exception as e:
                logger.error(f"Redis invalidation error for {recipient.id}: {e}")

            if found_qualified_partner:
                try:
                    lang = recipient.language_code or "en"
                    msg = get_msg(lang, "commission_received", amount=round(commission, 2), level=comm_level, from_user=buyer_name)
                    deferred_notifications.append(notification_service.send_standard(
                        chat_id=int(recipient.telegram_id), text=msg,
                        buttons=[[{"text": get_msg(lang, "btn_check_balance"), "web_app": {"url": settings.FRONTEND_URL}}]]
                    ))
                except Exception as e:
                    logger.error(f"Notification error for {recipient.id}: {e}")

    # Finalize Transaction (NO internal commit to maintain atomicity with caller)
    if earnings_to_add:
        session.add_all(earnings_to_add)
        try:
            await redis_pipe.execute()
        except Exception as e:
            logger.warning(f"Redis pipeline execution failed: {e}")
        
        if deferred_notifications:
            await asyncio.gather(*deferred_notifications, return_exceptions=True)
