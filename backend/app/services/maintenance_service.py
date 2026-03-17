
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import sessionmaker
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.broker import broker
from app.core.config import (
    settings,  # FIX H-1: was missing, caused NameError in reset_monthly_pro_tokens
)
from app.models.partner import Earning, Partner, XPTransaction, engine

logger = logging.getLogger(__name__)

@broker.task(schedule=[{"cron": "*/15 * * * *"}])
async def refresh_admin_stats():
    """
    Scheduled task to recalculate and cache admin dashboard KPIs.
    Runs every 15 minutes to ensure metrics are fresh while protecting DB performance.
    """
    from app.services.admin_service import admin_service
    logger.info("📡 Scheduled Task: Refreshing Admin Dashboard Stats...")
    await admin_service.get_dashboard_stats(force_refresh=True)
    logger.info("✅ Admin stats successfully refreshed by scheduler.")

@broker.task(schedule=[{"cron": "* * * * *"}])
async def process_notification_retries():
    """
    Scheduled task to process pending notification retries.
    Runs every minute to ensure timely delivery of previously failed messages.
    """
    from app.services.notification_service import notification_service
    logger.info("📡 Scheduled Task: Processing Notification Retries...")
    await notification_service.process_retries()
    logger.info("✅ Notification retries processing complete.")

@broker.task(schedule=[{"cron": "*/5 * * * *"}]) # Every 5 minutes
async def monitor_notification_health():
    """
    Automated health monitoring for the notification system.
    Alerts admins if pending notifications are stuck for more than 10 minutes.

    """
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import func

    from app.core.config import settings
    from app.models.notification_retry import NotificationRetry
    from app.services.notification_service import notification_service

    logger.info("📡 Scheduled Task: Checking Notification System Health...")
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        now = datetime.now(UTC).replace(tzinfo=None)
        ten_mins_ago = now - timedelta(minutes=10)
        
        stmt_stuck = select(func.count(NotificationRetry.id)).where(
            NotificationRetry.status == "pending",
            NotificationRetry.created_at <= ten_mins_ago
        )
        result_stuck = await session.execute(stmt_stuck)
        stuck_count = result_stuck.scalar() or 0
        
        if stuck_count >= 10:
            logger.error(f"🚨 NOTIFICATION SYSTEM CONGESTION: {stuck_count} stuck messages detected!")
            
            # Notify admins
            alert_msg = (
                "🚨 **NOTIFICATION SYSTEM CONGESTION**\n\n"
                f"Detected **{stuck_count}** pending notifications stuck for >10 minutes.\n\n"
                "Please check worker logs and `/notifications-health` for details."
            )
            
            for admin_id in settings.ADMIN_USER_IDS:
                # Use bypass_dedup=True for system alerts to ensure they arrive
                try:
                    await notification_service.send_critical(chat_id=str(admin_id), text=alert_msg, bypass_dedup=True)
                except Exception as e:
                    logger.error(f"Failed to send health alert to admin {admin_id}: {e}")
        else:
            logger.info(f"✅ Notification health check: {stuck_count} stuck messages. Status: Healthy.")

@broker.task(task_name="restore_names_task")
async def restore_names_task():
    """Distributed task for user name restoration from Telegram archives."""
    from app.services.redis_service import redis_service
    lock_key = "lock:restore_users_from_telegram"
    done_key = "restore:users_completed_v2"
    
    if await redis_service.client.get(done_key):
        return

    async with redis_service.client.lock(lock_key, timeout=600):
        # Double check done_key after acquiring lock
        if await redis_service.client.get(done_key):
            return
            
        logger.info("🔧 Running user restoration internal task...")
        from scripts.archive.restore_names_from_telegram import (
            restore_names_from_telegram,
        )
        restored_count = await restore_names_from_telegram()
        
        # Clear caches
        from scripts.clear_all_caches import clear_all_caches
        await clear_all_caches()
        
        await redis_service.client.set(done_key, "1", ex=86400 * 7)
        logger.info(f"✅ User restoration internal task complete: {restored_count}")

@broker.task(task_name="migrate_blog_task")
async def migrate_blog_task():
    """Distributed task for blog content synchronization."""
    from app.services.redis_service import redis_service
    lock_key = "lock:blog_migration_v2"
    
    async with redis_service.client.lock(lock_key, timeout=600):
        logger.info("🔧 Running blog migration internal task...")
        from scripts.migrate_blog import migrate
        await migrate()
        logger.info("✅ Blog migration internal task complete!")

@broker.task(task_name="reconcile_network_stats_task", schedule=[{"cron": "0 4 * * *"}])
async def reconcile_network_stats(session_override: AsyncSession = None) -> dict[str, Any]:
    """
    Unified high-performance network reconciliation.
    Fixes path, depth, and referral_count across the entire platform.
    Note: referral_count represents the Total Network Size (L1-L20) for 
    consistency with Leaderboard and Tasks systems.
    
    #comment: Implementing Distributed Locking via Redis (600s TTL).
    # This prevents multiple workers from attempting structural fixes simultaneously,
    # which could lead to race conditions or DB deadlocks.
    """
    from app.services.redis_service import redis_service
    
    lock_key = "lock:maintenance:reconcile"
    # We use a 10-minute lock for structural fixes
    async with redis_service.client.lock(lock_key, timeout=600):
        if session_override:
            return await _do_reconcile(session_override)
        
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            return await _do_reconcile(session)
    return {"status": "error", "message": "Failed to acquire lock"}

async def _do_reconcile(session: AsyncSession) -> dict[str, Any]:
    logger.info("🔧 Starting High-Performance Network Reconciliation...")
    start_time = datetime.now(UTC).replace(tzinfo=None)
    
    # 1. Fetch minimum required data for all partners in chunks to prevent OOM
    partner_map = {}
    FETCH_CHUNK = 10000
    offset = 0
    
    while True:
        stmt = (
            select(Partner.id, Partner.referrer_id, Partner.path, Partner.depth, Partner.referral_count)
            .order_by(Partner.id)
            .offset(offset)
            .limit(FETCH_CHUNK)
        )
        result = await session.exec(stmt)
        chunk = result.all()
        if not chunk:
            break
            
        for p in chunk:
            partner_map[p.id] = {"ref": p.referrer_id, "path": p.path, "depth": p.depth, "count": p.referral_count}
            
        offset += FETCH_CHUNK
        if len(chunk) < FETCH_CHUNK:
            break

    total_partners = len(partner_map)
    logger.info(f"📊 Mapping built for {total_partners} partners.")
    
    # 2. Reconcile Structures & Calculate Counts in memory
    path_updates, count_map = _calculate_network_fixes(partner_map)
    
    # 3. Batch Commit Structural Changes
    if path_updates:
        await _commit_structural_fixes(session, path_updates)

    # 4. Batch Commit Count Changes
    diff_counts = _calculate_count_diffs(partner_map, count_map)
    if diff_counts:
        await _commit_count_fixes(session, diff_counts)

    duration = (datetime.now(UTC).replace(tzinfo=None) - start_time).total_seconds()
    result_data = {
        "status": "success",
        "duration_sec": round(float(duration), 2),
        "total_partners": total_partners,
        "structural_fixes": len(path_updates),
        "count_fixes": len(diff_counts)
    }
    logger.info(f"✨ Reconciliation Complete: {result_data}")
    return result_data

def _calculate_network_fixes(partner_map: dict[int, dict]) -> tuple[list[dict], dict[int, int]]:
    """Internal logic for path/depth reconciliation and count accumulation."""
    path_updates = []
    count_map = {p_id: 0 for p_id in partner_map}
    
    for p_id, data in partner_map.items():
        correct_path = []
        curr_id = data["ref"]
        visited = set()
        
        while curr_id and curr_id not in visited:
            visited.add(curr_id)
            parent = partner_map.get(curr_id)
            if not parent: break
            correct_path.insert(0, str(curr_id))
            curr_id = parent["ref"]
            
        final_path = ".".join(correct_path) if correct_path else None
        final_depth = len(correct_path)
        
        if data["path"] != final_path or data["depth"] != final_depth:
            path_updates.append({"id": p_id, "path": final_path, "depth": final_depth})
            data["path"] = final_path
            data["depth"] = final_depth

        if final_path:
            anc_ids = [int(x) for x in final_path.split('.') if x.isdigit()]
            # Increment referral_count for ALL ancestors in the lineage (up to 20+ levels)
            for anc_id in anc_ids:
                if anc_id in count_map:
                    count_map[anc_id] += 1
                    
    return path_updates, count_map

def _calculate_count_diffs(partner_map: dict[int, dict], count_map: dict[int, int]) -> list[dict]:
    """Identifies partners whose referral_count is out of sync."""
    return [
        {"id": p_id, "count": real_count}
        for p_id, real_count in count_map.items()
        if partner_map[p_id]["count"] != real_count
    ]

async def _commit_structural_fixes(session: AsyncSession, path_updates: list[dict]):
    logger.info(f"💾 Committing {len(path_updates)} structural fixes...")
    for i in range(0, len(path_updates), 100):
        batch = path_updates[i:i + 100]
        for upd in batch:
            await session.execute(
                text("UPDATE partner SET path = :p, depth = :d WHERE id = :i"),
                {"p": upd["path"], "d": upd["depth"], "i": upd["id"]}
            )
        await session.commit()

async def _commit_count_fixes(session: AsyncSession, diff_counts: list[dict]):
    logger.info(f"💾 Committing {len(diff_counts)} count reconciliations...")
    for i in range(0, len(diff_counts), 500):
        batch = diff_counts[i:i + 500]
        for upd in batch:
            await session.execute(
                text("UPDATE partner SET referral_count = :c WHERE id = :i"),
                {"c": upd["count"], "i": upd["id"]}
            )
        await session.commit()

@broker.task(task_name="cleanup_stale_transactions", schedule=[{"cron": "0 2 * * *"}]) # 2 AM daily
async def cleanup_stale_transactions():
    """
    Deletes 'pending' transactions older than 48 hours to prevent DB bloat.
    """
    logger.info("🧹 Starting stale transactions cleanup...")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=48)
    
    async with async_session() as session:
        from app.models.transaction import PartnerTransaction
        
        # Count first for logging
        count_stmt = select(func.count(PartnerTransaction.id)).where(
            PartnerTransaction.status == "pending",
            PartnerTransaction.created_at < cutoff
        )
        to_delete = (await session.exec(count_stmt)).one() or 0
        
        if to_delete > 0:
            # #comment: Break circular dependency before deletion.
            # If any partner has one of these stale transactions as their 'last_transaction_id',
            # the DELETE will fail without this step.
            nullify_stmt = text(
                "UPDATE partner SET last_transaction_id = NULL "
                "WHERE last_transaction_id IN ("
                "  SELECT id FROM partnertransaction "
                "  WHERE status = 'pending' AND created_at < :cutoff"
                ")"
            )
            await session.execute(nullify_stmt, {"cutoff": cutoff})
            
            del_stmt = text("DELETE FROM partnertransaction WHERE status = 'pending' AND created_at < :cutoff")
            await session.execute(del_stmt, {"cutoff": cutoff})
            await session.commit()
            logger.info(f"✅ Cleaned up {to_delete} stale transactions (and nullified related FKs).")
        else:
            logger.info("✅ No stale transactions found.")

async def check_database_health() -> dict:
    """Rapid health check for database performance."""
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        start = datetime.now(UTC).replace(tzinfo=None)
        await session.execute(text("SELECT 1"))
        latency_ms = (datetime.now(UTC).replace(tzinfo=None) - start).total_seconds() * 1000
        
        res_orphaned = await session.execute(text("SELECT count(*) FROM partner WHERE referrer_id IS NOT NULL AND path IS NULL"))
        orphaned_count = res_orphaned.scalar() or 0
        
        return {
            "status": "healthy" if orphaned_count == 0 else "degraded",
            "latency_ms": round(float(latency_ms), 2),
            "orphaned_count": orphaned_count,
            "timestamp": datetime.now(UTC).replace(tzinfo=None).isoformat()
        }
    return {"status": "error", "message": "Database health check failed"}

async def check_tree_integrity(session: AsyncSession) -> dict[str, Any]:
    """
    Validates the integrity of the materialized path and depth.
    Ensures that depth matches the number of segments in the path.
    """
    logger.info("🔍 Running Tree Integrity Audit...")
    
    result = await session.exec(select(Partner.id, Partner.path, Partner.depth))
    partners = result.all()
    
    anomalies = []
    for p_id, p_path, p_depth in partners:
        expected_depth = 0
        if p_path:
            # Handle possible trailing dots or empty segments if they ever occur
            expected_depth = len([x for x in p_path.split('.') if x])
        
        if expected_depth != p_depth:
            anomalies.append({
                "id": p_id,
                "path": p_path,
                "current_depth": p_depth,
                "expected_depth": expected_depth
            })
            
    return {
        "status": "healthy" if not anomalies else "anomalous",
        "total_checked": len(partners),
        "anomaly_count": len(anomalies),
        "anomalies": anomalies[:100] # Limit output
    }

@broker.task(task_name="cleanup_old_audit_logs", schedule=[{"cron": "0 3 * * *"}]) # 3 AM daily
async def cleanup_old_audit_logs():
    """
    Deletes audit logs older than 90 days to maintain dashboard performance.
    """
    logger.info("🧹 Starting audit log cleanup...")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=90)
    
    async with async_session() as session:
        from app.models.audit_log import AuditLog
        
        # Count first for logging
        count_stmt = select(func.count(AuditLog.id)).where(
            AuditLog.created_at < cutoff
        )
        to_delete = (await session.exec(count_stmt)).one() or 0
        
        if to_delete > 0:
            del_stmt = text("DELETE FROM audit_log WHERE created_at < :cutoff")
            await session.execute(del_stmt, {"cutoff": cutoff})
            await session.commit()
            logger.info(f"✅ Cleaned up {to_delete} old audit logs.")
        else:
            logger.info("✅ No old audit logs found.")

@broker.task(task_name="reset_monthly_pro_tokens", schedule=[{"cron": "0 0 1 * *"}]) # Midnight on 1st of month
async def reset_monthly_pro_tokens():
    """
    Recalculates and resets PRO/PRO+ tokens on the 1st of every month.
    Deletes unused tokens and sets specifically:
    - PRO_MONTHLY: 250 tokens
    - PRO_PLUS_MONTHLY: 500 tokens
    """
    logger.info("📅 Starting Monthly PRO Token Reset...")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    now = datetime.now(UTC).replace(tzinfo=None)
    
    async with async_session() as session:
        # 1. Reset PRO+ (500 tokens)
        stmt_plus = text(
            "UPDATE partner SET pro_tokens = :t, pro_tokens_last_reset = :now "
            "WHERE subscription_plan = 'PRO_PLUS_MONTHLY' AND is_pro = true"
        )
        await session.execute(stmt_plus, {"t": settings.PRO_PLUS_TOKENS_MONTHLY, "now": now})
        
        # 2. Reset Standard PRO (250 tokens)
        # Includes PRO_MONTHLY, PRO_LIFETIME and edge cases (NULL)
        stmt_pro = text(
            "UPDATE partner SET pro_tokens = :t, pro_tokens_last_reset = :now "
            "WHERE subscription_plan IN ('PRO_MONTHLY', 'PRO_LIFETIME') OR (subscription_plan IS NULL AND is_pro = true)"
        )
        await session.execute(stmt_pro, {"t": settings.PRO_TOKENS_MONTHLY, "now": now})
        
        await session.commit()
        logger.info("✅ Monthly token reset complete for all active PRO users.")

async def run_economy_audit(session: AsyncSession, auto_fix: bool = False) -> dict[str, Any]:
    """
    Runs the economy integrity logic and returns the results.
    If auto_fix is True, it will align Partner.xp/balance with the ledger totals.
    """
    from app.services.audit_service import audit_service

    # 1. Fetch XP and Balance sums from ledger (already grouped, relatively small)

    xp_sums_result = await session.exec(
        select(XPTransaction.partner_id, func.sum(XPTransaction.amount).label("total"))
        .group_by(XPTransaction.partner_id)
    )
    xp_sums = {row.partner_id: float(row.total or 0) for row in xp_sums_result.all()}

    bal_sums_result = await session.exec(
        select(Earning.partner_id, func.sum(Earning.amount).label("total"))
        .where(Earning.currency == "USDT")
        .group_by(Earning.partner_id)
    )
    bal_sums = {row.partner_id: float(row.total or 0) for row in bal_sums_result.all()}

    flags = 0
    anomalies = []
    total_checked = 0
    FETCH_CHUNK = 5000
    offset = 0
    
    while True:
        # Fetch partners in chunks to avoid OOM
        stmt = select(Partner).order_by(Partner.id).offset(offset).limit(FETCH_CHUNK)
        result = await session.exec(stmt)
        partners_chunk = result.all()
        if not partners_chunk:
            break
            
        for partner in partners_chunk:
            total_checked += 1
            p_id = partner.id
            p_tg_id = partner.telegram_id
            p_xp = partner.xp
            p_balance = partner.balance

            xp_sum = xp_sums.get(p_id, 0.0)
            bal_sum = bal_sums.get(p_id, 0.0)

            xp_diff = float(p_xp) - xp_sum
            bal_diff = float(p_balance) - bal_sum

            if abs(xp_diff) > 0.01:
                logger.warning(f"⚠️ XP Discrepancy for {p_tg_id}: DB={p_xp}, Sum={xp_sum}")
                await audit_service.log_event(
                    session=session,
                    entity_type="system",
                    entity_id=str(p_tg_id),
                    action="integrity_discrepancy",
                    details={"type": "XP", "db_value": float(p_xp), "sum_value": xp_sum, "diff": xp_diff}
                )
                
                if auto_fix:
                    partner.xp = xp_sum
                    session.add(partner)

                flags += 1
                anomalies.append({
                    "type": "XP", 
                    "partner_id": p_tg_id, 
                    "expected": xp_sum, 
                    "actual": float(p_xp), 
                    "diff": xp_diff
                })

            if abs(bal_diff) > 0.01:
                logger.warning(f"⚠️ Balance Discrepancy for {p_tg_id}: DB={p_balance}, Sum={bal_sum}")
                await audit_service.log_event(
                    session=session,
                    entity_type="system",
                    entity_id=str(p_tg_id),
                    action="integrity_discrepancy",
                    details={"type": "BALANCE", "db_value": float(p_balance), "sum_value": bal_sum, "diff": bal_diff}
                )

                if auto_fix:
                    partner.balance = bal_sum
                    session.add(partner)

                flags += 1
                anomalies.append({
                    "type": "BALANCE", 
                    "partner_id": p_tg_id, 
                    "expected": bal_sum, 
                    "actual": float(p_balance), 
                    "diff": bal_diff
                })
        
        # Partially commit to release locks or clear session memory if needed
        # But caution: automatic commit here might interfere with the caller's transaction
        # So we just keep going. session.add(partner) is fine.
        
        offset += FETCH_CHUNK
        if len(partners_chunk) < FETCH_CHUNK:
            break

    if flags > 0:
        await session.commit()
        
    return {
        "status": "anomalous" if flags > 0 else "healthy",
        "total_checked": total_checked,
        "discrepancies_found": flags,
        "anomalies": anomalies[:50]
    }

@broker.task(task_name="economy_integrity_audit_task", schedule=[{"cron": "0 5 * * *"}])
async def economy_integrity_audit_task():
    """
    Background worker that verifies the economic integrity of all partners.
    """
    logger.info("🛡️ Starting Economy Integrity Audit...")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        res = await run_economy_audit(session)
        flags = res["discrepancies_found"]
        if flags > 0:
            logger.info(f"✅ Economy audit complete. {flags} discrepancies found and logged.")
        else:
            logger.info("✅ Economy audit complete. No discrepancies found.")

@broker.task(task_name="cleanup_notification_retries", schedule=[{"cron": "0 6 * * *"}]) # 6 AM daily
async def cleanup_notification_retries():
    """
    Deletes 'failed' notification retries older than 7 days.
    Also cleans up historic test data that may have been left behind.
    """
    logger.info("🧹 Starting notification retry cleanup...")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
    
    async with async_session() as session:
        from app.models.notification_retry import NotificationRetry
        
        # Count failed items older than cutoff
        stmt = select(func.count(NotificationRetry.id)).where(
            NotificationRetry.status == "failed",
            NotificationRetry.created_at < cutoff
        )
        count = (await session.execute(stmt)).scalar() or 0
        
        if count > 0:
            del_stmt = text("DELETE FROM notificationretry WHERE status = 'failed' AND created_at < :cutoff")
            await session.execute(del_stmt, {"cutoff": cutoff})
            await session.commit()
            logger.info(f"✅ Cleaned up {count} stale failed notification retries.")
        else:
            logger.info("✅ No stale failed notifications found.")

@broker.task(task_name="nightly_reconciliation_task", schedule=[{"cron": "0 1 * * *"}])  # 1 AM daily
async def nightly_reconciliation_task():
    """
    Nightly automated event ledger reconciliation.
    Cross-checks every partner's XP and USDT balance against the sum of all
    XPTransaction and Earning records. Flags and logs any discrepancy via
    audit_service.log_reconciliation_flag(), and alerts admins if critical.
    
    This is the emergency double-check system — an alternative source of truth
    to verify that commissions, XP, and distributions have been accurately applied.
    """
    from sqlalchemy import func
    from sqlalchemy.orm import sessionmaker
    from sqlmodel import select
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.models.audit_log import ActionType
    from app.models.partner import Earning, Partner, XPTransaction, engine
    from app.services.audit_service import audit_service
    from app.services.notification_service import notification_service

    logger.info("🔍 Nightly Reconciliation Task: Starting...")

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # Utilize the enhanced shared audit logic
        # We don't auto-fix in the nightly task unless triggered, 
        # but we do alerts on discrepancies found.
        res = await run_economy_audit(session, auto_fix=False)
        
        flag_count = res.get("discrepancies_found", 0)
        total_checked = res.get("total_checked", 0)

        if flag_count > 0:
            logger.warning(f"⚠️ Nightly Reconciliation: {flag_count} discrepancies found.")

            # Alert admins if flags encountered
            if flag_count >= 5:
                # Extract some anomaly info for the alert
                anomalies_msg = ""
                for a in res.get("anomalies", [])[:3]:
                    anomalies_msg += f"\n• Partner {a['partner_id']}: {a['type']} Diff {a['diff']:+.2f}"

                alert = (
                    f"⚠️ <b>NIGHTLY RECONCILIATION ALERT</b>\n\n"
                    f"Found <b>{flag_count}</b> discrepancies in XP/USDT balances among {total_checked} partners.\n"
                    f"{anomalies_msg}\n\n"
                    f"Check Admin Panel → Ledger → Reconciliation for details.\n"
                    f"Run <code>POST /admin/ledger/reconcile</code> for live data."
                )
                for admin_id in settings.ADMIN_USER_IDS:
                    try:
                        await notification_service.send_critical(
                            chat_id=str(admin_id),
                            text=alert,
                            parse_mode="HTML",
                            bypass_dedup=True
                        )
                    except Exception as e:
                        logger.error(f"Failed to alert admin {admin_id}: {e}")
        else:
            logger.info(f"✅ Nightly Reconciliation: All {total_checked} partners healthy. No discrepancies.")

