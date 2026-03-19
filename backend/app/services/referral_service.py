import asyncio
import logging

import sentry_sdk
from typing import Any, Dict, List, cast
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.broker import broker
from app.core.config import settings
from app.core.i18n import get_msg
from app.core.retry import async_retry
from app.models.audit_log import ActionType
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
            # Use a single Redis pipeline for all invalidations in this signup event
            async with redis_service.client.pipeline(transaction=False) as redis_pipe:
                xp_txs, deferred_tasks = await _process_referral_awards(session, partner, ancestor_map, redis_pipe)
                
                # 3. Batch Commit & Finalize Notifications
                if xp_txs or deferred_tasks:
                    if xp_txs:
                        session.add_all(xp_txs)
                    await session.commit()
                    # Execute Redis invalidations after DB commit for consistency
                    await redis_pipe.execute()
                    await _finalize_referral_logic(deferred_tasks)

    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"Error in process_referral_logic: {e}", exc_info=True)

async def _is_already_awarded(session: AsyncSession, partner_id: int) -> bool:
    check_stmt = select(XPTransaction).where(
        XPTransaction.reference_id == str(partner_id),
        XPTransaction.type.in_(["REFERRAL_L1", "REFERRAL_DEEP", "REFERRAL_SIGNUP"])
    ).limit(1).with_for_update()
    return (await session.exec(check_stmt)).first() is not None

async def _get_ancestor_map(session: AsyncSession, partner: Partner) -> dict[int, Partner]:
    lineage_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
    if partner.referrer_id and partner.referrer_id not in lineage_ids:
        lineage_ids.append(partner.referrer_id)
    lineage_ids = sorted(list(set(lineage_ids)))
    
    result = await session.exec(select(Partner).where(Partner.id.in_(lineage_ids)).with_for_update())

    return {p.id: p for p in result.all()}

async def _process_referral_awards(session: AsyncSession, partner: Partner, ancestor_map: dict[int, Partner], redis_pipe) -> tuple[list[XPTransaction], list]:
    xp_txs = []
    deferred_tasks = []
    audit_logs = []
    earnings = []
    current_referrer_id = partner.referrer_id
    new_partner_name = format_partner_name(partner)
    
    # Pre-calculate full ancestry for accurate chain slicing
    # path_ids: [root_id, L1_id, L2_id, ..., L(N-1)_id]
    path_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
    # full_lineage_names: names corresponding to full_lineage_ids
    # Use dict.fromkeys to preserve order while removing potential duplicates (Bug: direct referrer often already in path)
    full_lineage_ids: List[int] = list(dict.fromkeys([*path_ids, partner.referrer_id])) if partner.referrer_id else path_ids
    full_lineage_names: List[str] = [format_partner_name(ancestor_map[aid]) for aid in full_lineage_ids if aid in ancestor_map]
    
    for level in range(1, 21):
        if not current_referrer_id: break
        referrer = ancestor_map.get(current_referrer_id)
        if not referrer: break

        lang = referrer.language_code or "en"

        # Compression Logic Check
        qualified = False
        if level <= 3:
            qualified = True
        elif level <= 9:
            qualified = referrer.is_pro
        else:
            qualified = referrer.is_pro_plus

        if not qualified:
            if level in [4, 10]:
                fomo_msg = get_msg(lang, "pro_fomo_missed", level=level)
                btn_text = get_msg(lang, "btn_upgrade")
                buttons = [[{"text": btn_text, "web_app": {"url": settings.FRONTEND_URL}}]]
                deferred_tasks.append(notification_service.send_critical(
                    chat_id=str(referrer.telegram_id), text=fomo_msg, buttons=buttons,
                    salt=f"pro_fomo_{level}_{partner.id}"
                ))
            
            current_referrer_id = referrer.referrer_id
            continue

        try:
            # XP Calculation & Level Up
            xp_gain = _calculate_referral_xp(level, referrer)
            xp_before = float(referrer.xp)
            xp_after = xp_before + xp_gain
            
            # Atomic Increments (XP and Total Network Count)
            referrer.xp = Partner.xp + xp_gain
            referrer.referral_count = Partner.referral_count + 1
            
            xp_txs.append(XPTransaction(
                partner_id=referrer.id, amount=xp_gain,
                type="REFERRAL_SIGNUP",
                description=f"Referral Partner Joined (L{level})", reference_id=str(partner.id)
            ))

            earnings.append(Earning(
                partner_id=referrer.id,
                amount=float(xp_gain),
                description=f"Referral Reward: {new_partner_name} (L{level})",
                type="REFERRAL_XP",
                currency="XP",
                reference_id=f"ref_xp_{partner.id}_{referrer.id}"
            ))

            audit_logs.append(cast(Dict[str, Any], {
                "partner_id": referrer.id,
                "action_type": ActionType.XP_AWARD,
                "description": f"XP Awarded: +{float(xp_gain):.2f} (L{level})",
                "entity_type": "partner", "entity_id": str(referrer.id), "action": "xp_award",

                "details": {"new_user_id": partner.id, "xp_amount": xp_gain, "level": level, "xp_before": xp_before, "xp_after": xp_after}
            }))
            audit_logs.append({
                "partner_id": referrer.id,
                "action_type": ActionType.REFERRAL,
                "description": f"New referral (L{level}): @{partner.username or partner.telegram_id} joined under #{referrer.id}",
                "entity_type": "referral", "entity_id": str(partner.id), "action": "referral_signup",
                "details": {"new_partner_id": partner.id, "referrer_id": referrer.id, "level": level}
            })

            await _check_level_up(referrer, deferred_tasks, xp_after)
            await _stage_redis_invalidation(referrer, level, xp_gain=xp_gain, pipe=redis_pipe)
            
            # Chain for the referrer starts with "You" and then lists children down to the new partner
            # Example for L3 parent: You (L3) <- L2_parent <- L1_parent <- New_Partner
            # The children are the elements in full_lineage_names AFTER the referrer
            try:
                ref_idx = int(full_lineage_ids.index(referrer.id))
                slice_start = ref_idx + 1
                children_names = full_lineage_names[slice_start:]

                msg_chain = [get_msg(lang, "you"), *children_names]
            except (ValueError, IndexError):
                msg_chain = [get_msg(lang, "you")]

            msg_task = _prepare_referral_notification(referrer, level, float(xp_gain), new_partner_name, msg_chain, salt=str(partner.id))
            deferred_tasks.append(msg_task)

        except Exception as e:
            logger.error(f"❌ Failed level {level} for {referrer.id}: {e}")
        
        current_referrer_id = referrer.referrer_id
        session.add(referrer)

    # Batch inserts
    if earnings: session.add_all(earnings)
    if audit_logs: await audit_service.log_events_bulk(session, audit_logs)

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

    async def _work(p):
        tg_id = str(referrer.telegram_id)
        p.delete(f"partner:profile:v4:{tg_id}")
        p.delete(f"partner:profile:{tg_id}") # Cleanup old style
        p.delete(f"profile_cache_v3:{referrer.id}") # Cleanup very old style
        p.delete(f"partner:earnings:{tg_id}")
        p.delete(f"ref_tree_stats_v2:{referrer.id}")
        p.delete(f"ref_tree_members_v2:{referrer.id}:{level}")
        for tf in ["24H", "7D", "1M", "3M", "6M", "1Y"]:
            p.delete(f"growth_metrics:{referrer.id}:{tf}")

    if pipe is not None:
        await _work(pipe)
    else:
        try:
            async with redis_service.client.pipeline(transaction=False) as p:
                await _work(p)
                await p.execute()
        except Exception as e:
            logger.warning(f"Redis invalidation failed (one-off): {e}")

def _prepare_referral_notification(referrer: Partner, level: int, xp: float, name: str, chain: list, salt: str = ""):
    chain_text = " → ".join([*chain, name])
    lang = referrer.language_code or "en"
    xp_val = float(xp)
    if hasattr(xp_val, "is_integer") and xp_val.is_integer():
        clean_xp = int(xp_val)
    else:
        # Use string formatting to avoid round() overload issues in this environment
        clean_xp = float(f"{xp_val:.2f}")
    buttons = [[
        {"text": get_msg(lang, "btn_view_network"), "web_app": {"url": f"{settings.FRONTEND_URL}?start_param=network"}},
        {"text": get_msg(lang, "btn_open_app"), "web_app": {"url": settings.FRONTEND_URL}}
    ]]
    if level == 1: msg = get_msg(lang, "referral_l1_congrats", name=name, xp=clean_xp)
    elif level == 2: msg = get_msg(lang, "referral_l2_congrats", referral_chain=chain_text, xp=clean_xp)
    else: msg = get_msg(lang, "referral_deep_activity", level=level, referral_chain=chain_text, xp=clean_xp)
    
    return notification_service.send_low_prio(chat_id=str(referrer.telegram_id), text=msg, buttons=buttons, salt=salt)

async def _finalize_referral_logic(deferred_tasks: list):
    if deferred_tasks:
        await asyncio.gather(*deferred_tasks, return_exceptions=True)

@async_retry(max_attempts=3, base_delay=1.0)
async def distribute_pro_commissions(session: AsyncSession, partner_id: int, total_amount: float, plan_type: str | None = None, transaction_id: int | None = None):
    """
    Distributes commissions for PRO ($39) or PRO+ ($69) subscription purchase.
    Implements DYNAMIC COMPRESSION: If an intermediary is not PRO, the commission 
    jumps to the next qualified upline leader.
    """
    partner = await session.get(Partner, partner_id)
    if not partner:
        return

    # #comment: Phase 3 Idempotency Guard
    # If this function is retried by TaskIQ (due to network error, DB timeout, etc.),
    # we must NOT re-insert all Earning records. Check for existing records first.
    if transaction_id:
        idempotency_key = f"upg_agg_t{transaction_id}"
        existing_earning = await session.exec(
            select(Earning).where(Earning.reference_id.like(f"{idempotency_key}%")).limit(1)
        )
        if existing_earning.first():
            logger.warning(f"Commission for t{transaction_id} already distributed. Skipping retry.")
            return

    # Deterministic Reference Prefix (Ensures Idempotency per Transaction)
    ref_prefix = f"t{transaction_id}" if transaction_id else f"p{partner.id}"

    # Determine Model: PRO ($39) or PRO+ ($69)
    # Use plan_type if provided, else fallback to amount-based detection
    is_pro_plus_purchase = "PRO_PLUS" in plan_type if plan_type else total_amount >= (settings.PRO_PLUS_PRICE_USD - 0.1)
    
    comm_map = settings.COMMISSION_MAP_GROWTH_STRATEGY
    _max_recipients = 20

    # Resolve ALL Ancestors for compression logic
    # partner.path contains ancestors from root down to direct referrer.
    path_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
    lineage_ids = [*path_ids, partner.referrer_id] if partner.referrer_id else path_ids
    lineage_ids = list(dict.fromkeys(lineage_ids))
    
    # Fetch all ancestors in bulk with pessimistic locking
    # #comment Phase 3 Reliability: with_for_update() prevents race conditions.
    # We SORT the IDs to enforce a global locking order and prevent deadlocks
    # between simultaneous upgrades in the same lineage.
    sorted_lineage_ids = sorted(lineage_ids)
    statement = select(Partner).where(Partner.id.in_(sorted_lineage_ids)).with_for_update()
    result = await session.exec(statement)
    ancestor_map = {p.id: p for p in result.all()}

    # --- PROFESSIONAL DYNAMIC COMPRESSION MODEL ---
    # Goal: Award each commission slice (L1-L20) to the NEXT qualified upline leader.
    # If a partner is not qualified for their expected level, we skip them and 
    # look for the next person in the lineage who is.
    
    # MISSION-CRITICAL: Ensure company account is resolved correctly from config
    admin_id_to_fetch = settings.ADMIN_USER_IDS[0] if settings.ADMIN_USER_IDS else "716720099"
    stmt_admin = select(Partner).where(Partner.telegram_id == admin_id_to_fetch).with_for_update()
    res_admin = await session.exec(stmt_admin)
    company_account = res_admin.first()

    ancestors_at_dist: List[int] = list(reversed(lineage_ids))
    balance_cache: Dict[int, float] = {}
    xp_cache: Dict[int, float] = {}
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
    curr_lineage_idx: int = 0

    buyer_name = format_partner_name(partner)
    
    # Recipient Tracking for Aggregated Notifications/Audits
    recipient_totals: Dict[int, Dict[str, Any]] = {} # {recipient_id: {"amount": float, "xp": float, "levels": list[int], "qualified": bool}}


    async with redis_service.client.pipeline(transaction=False) as redis_pipe:
        # Loop through each commission level (slice of the pie)
        for comm_level in range(1, 21):
            pct = comm_map.get(comm_level, 0)
            if pct <= 0: continue
            
            commission = float(f"{(total_amount * pct):.4f}")

            recipient = None
            found_qualified_partner = False
            first_skipped_partner = None
            
            # Find the NEXT available partner in the chain who qualifies for this level
            while curr_lineage_idx < len(ancestors_at_dist):
                idx = int(curr_lineage_idx)
                referrer_id = ancestors_at_dist[idx]

                referrer = ancestor_map.get(referrer_id)
                curr_lineage_idx = idx + 1

                
                if not referrer: continue
                
                # Qualification Check
                is_ref_pro_plus = referrer.is_pro_plus
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
                        
                        target_plan = "PRO+" if comm_level > 9 else "PRO"
                        fmt_comm = float(f"{commission:.2f}")
                        fomo_msg = get_msg(lang, "commission_fomo_missed", amount=fmt_comm, level=comm_level, target_plan=target_plan)
                        btn_text = get_msg(lang, "btn_upgrade")
                        deferred_notifications.append(notification_service.send_critical(
                            chat_id=str(referrer.telegram_id), text=fomo_msg,
                            buttons=[[{"text": btn_text, "web_app": {"url": settings.FRONTEND_URL}}]],
                            salt=f"comm_fomo_{ref_prefix}_l{comm_level}"
                        ))
            
            # If no more qualified partners in lineage, commission leaks to Company
            if not recipient:
                recipient = company_account
                
            if not recipient: continue # Should not happen if company_account is set

            if recipient.id not in recipient_totals:
                recipient_totals[recipient.id] = {"amount": 0.0, "xp": 0.0, "levels": [], "qualified": False}
            
            rt = cast(Dict[str, Any], recipient_totals[recipient.id])
            rt["amount"] = float(rt.get("amount", 0.0)) + float(commission)
            cast(List, rt["levels"]).append(comm_level)
            if found_qualified_partner:
                rt["qualified"] = True


            # Award commission state tracking
            balance_cache[recipient.id] = float(f"{(float(balance_cache.get(recipient.id, 0.0)) + commission):.4f}")

            
            # --- XP COMMISSION FOR ACTIVE REFERRAL ---
            # #comment Phase 3: Aggregating XP gain to update only once per unique recipient.
            xp_gain_val = float(_calculate_referral_xp(comm_level, recipient))
            xp_cache[recipient.id] = float(f"{(float(xp_cache.get(recipient.id, 0.0)) + xp_gain_val):.4f}")
            rt["xp"] = float(rt.get("xp", 0.0)) + xp_gain_val
            
        # --- Aggregated Side Effects Post-Loop ---
        for r_id, rt in recipient_totals.items():
            rcpt = ancestor_map.get(r_id) or (company_account if company_account and r_id == company_account.id else None)
            if not rcpt: continue
            
            # #comment Phase 3: Single atomic update per unique recipient to avoid BinaryExpression overwrites.
            # This ensures that if a recipient receives multiple slices (e.g. Admin or Company fallback),
            # all of them are correctly summed into the database fields.
            rcpt.balance = Partner.balance + rt["amount"]
            rcpt.total_earned_usdt = Partner.total_earned_usdt + rt["amount"]
            rcpt.xp = Partner.xp + rt["xp"]
            session.add(rcpt)

            xp_after = xp_cache.get(r_id, 0.0)
            xp_before = xp_after - rt["xp"]
            balance_after = balance_cache.get(r_id, 0.0)
            balance_before = balance_after - rt["amount"]

            plan_name = "PRO+" if is_pro_plus_purchase else "PRO"
            is_admin = str(rcpt.telegram_id) in settings.ADMIN_USER_IDS
            
            levels: list[int] = rt.get("levels", [])
            if is_admin:
                desc = f"Global Network Revenue (L{levels[0]}{'-L'+str(levels[-1]) if len(levels) > 1 else ''})"
            elif len(levels) > 1:
                desc = f"{plan_name} Aggregated Commission (L{levels[0]}-L{levels[-1]})"
            else:
                desc = f"{plan_name} Commission (L{levels[0]})"

                if not rt["qualified"]:
                    desc = f"Missed Tree Revenue: Compression Leakage (L{rt['levels'][0]})"

            earnings_to_add.append(Earning(
                partner_id=r_id,
                amount=round(rt["amount"], 4),
                description=desc,
                type="COMMISSION",
                level=rt["levels"][0],
                currency="USDT",
                reference_id=f"upg_agg_{ref_prefix}_{r_id}"
            ))

            earnings_to_add.append(Earning(
                partner_id=r_id,
                amount=round(rt["xp"], 2),
                description=f"Active Referral: {buyer_name} (L{rt['levels'][0]}{'-L'+str(rt['levels'][-1]) if len(rt['levels']) > 1 else ''})",
                type="REFERRAL_XP",
                currency="XP",
                reference_id=f"upg_xp_earning_agg_{ref_prefix}_{r_id}"
            ))

            session.add(XPTransaction(
                partner_id=r_id, 
                amount=float(f"{float(rt['xp']):.2f}"),
                type="ACTIVE_REFERRAL",
                description=f"Active Referral XP (L{rt['levels'][0]}{'-L'+str(rt['levels'][-1]) if len(rt['levels']) > 1 else ''})",
                reference_id=f"upg_xp_agg_{ref_prefix}_{r_id}"
            ))

            try:
                await audit_service.log_commission(
                    session=session, partner_id=r_id, buyer_id=partner.id,
                    amount=rt["amount"], level=rt["levels"][0],
                    balance_before=balance_before, balance_after=balance_after,
                    details={"all_levels": rt["levels"]}
                )
            except Exception as e:
                logger.error(f"Audit log_commission error for {r_id}: {e}")

            try:
                await audit_service.log_xp_award(
                    session=session, partner_id=r_id, buyer_id=partner.id,
                    xp_amount=rt["xp"], level=rt["levels"][0], is_pro=rcpt.is_pro,
                    xp_before=xp_before, xp_after=xp_after,
                    details={"all_levels": rt["levels"]}
                )
            except Exception as e:
                logger.error(f"Audit log_xp_award error for {r_id}: {e}")

            try:
                await _check_level_up(rcpt, deferred_notifications, xp_after)
            except Exception as e:
                logger.error(f"Level up check error for {r_id}: {e}")

            try:
                await _stage_redis_invalidation(rcpt, rt["levels"][0], xp_gain=rt["xp"], pipe=redis_pipe)
            except Exception as e:
                logger.error(f"Redis invalidation error for {r_id}: {e}")

            if rt["qualified"]:
                try:
                    lang = rcpt.language_code or "en"
                    
                    # Determine Plan Name for notification
                    plan_name = "PRO+" if is_pro_plus_purchase else "PRO"
                    
                    if rcpt.is_pro_plus:
                        # Elite Notification for PRO+ Leaders
                        # #comment Phase 2: Increased transparency. Include the USDT reward amount in the elite notification.
                        msg = get_msg(
                            lang, "referral_upgrade_announcement", 
                            buyer_name=buyer_name, level=rt["levels"][0], 
                            plan_name=plan_name, amount=round(rt["amount"], 2)
                        )
                    else:
                        # Standard Notification for PRO members
                        if len(rt["levels"]) > 1:
                            msg = f"💰 *Multiple Commissions Received!*\n\nTotal: *{round(rt['amount'], 2)} USDT* from *{buyer_name}*."
                        else:
                            msg = get_msg(lang, "commission_received", amount=float(f"{float(rt['amount']):.2f}"), level=rt["levels"][0], from_user=buyer_name)
                    
                    # Force notification for Admin even if not 'qualified' per standard logic (Leakage monitoring)
                    is_admin_recipient = str(rcpt.telegram_id) in settings.ADMIN_USER_IDS
                    if rt["qualified"] or is_admin_recipient:
                        deferred_notifications.append(notification_service.send_standard(
                            chat_id=str(rcpt.telegram_id), text=msg,
                            buttons=[[{"text": get_msg(lang, "btn_check_balance"), "web_app": {"url": settings.FRONTEND_URL}}]],
                            salt=f"upg_agg_{partner.id}"
                        ))
                except Exception as e:
                    logger.error(f"Notification error for {r_id}: {e}")

    # Finalize Transaction (NO internal commit to maintain atomicity with caller)
    if earnings_to_add:
        session.add_all(earnings_to_add)
    
    return redis_pipe, deferred_notifications
