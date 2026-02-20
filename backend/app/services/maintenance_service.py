
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
    from datetime import datetime, UTC, timedelta
    from sqlalchemy import func
    from app.models.notification_retry import NotificationRetry
    from app.services.notification_service import notification_service
    from app.core.config import settings

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
                    await notification_service.send_critical(chat_id=int(admin_id), text=alert_msg, bypass_dedup=True)
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

async def _do_reconcile(session: AsyncSession) -> dict[str, Any]:
    logger.info("🔧 Starting High-Performance Network Reconciliation...")
    start_time = datetime.now(UTC).replace(tzinfo=None)
    
    # 1. Fetch minimum required data for all partners
    result = await session.exec(select(Partner.id, Partner.referrer_id, Partner.path, Partner.depth, Partner.referral_count))
    partners = result.all()
    partner_map = {p.id: {"ref": p.referrer_id, "path": p.path, "depth": p.depth, "count": p.referral_count} for p in partners}
    
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
        "duration_sec": round(duration, 2),
        "total_partners": len(partners),
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
            del_stmt = text("DELETE FROM partnertransaction WHERE status = 'pending' AND created_at < :cutoff")
            await session.execute(del_stmt, {"cutoff": cutoff})
            await session.commit()
            logger.info(f"✅ Cleaned up {to_delete} stale transactions.")
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
            "latency_ms": round(latency_ms, 2),
            "orphaned_count": orphaned_count,
            "timestamp": datetime.now(UTC).replace(tzinfo=None).isoformat()
        }

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

@broker.task(task_name="economy_integrity_audit_task", schedule=[{"cron": "0 5 * * *"}])
async def economy_integrity_audit_task():
    """
    Background worker that verifies the economic integrity of all partners.
    Checks if current XP and Balance match the sum of transactions/earnings.
    Flags discrepancies in the audit log for manual review.
    
    #comment: FIX H-3 — Replaced N+1 pattern (1 query per partner × 2 = 2N queries) with
    3 bulk aggregation queries total. For 5000 users this goes from ~10,000 DB round-trips
    to 3, reducing audit time from minutes to seconds.
    """
    logger.info("🛡️ Starting Economy Integrity Audit...")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        from app.services.audit_service import audit_service

        # 1. Fetch only needed columns (not full ORM objects) — prevents memory pressure
        result = await session.exec(
            select(Partner.id, Partner.telegram_id, Partner.xp, Partner.balance)
        )
        partners = result.all()

        # 2. Bulk aggregate XP sums per partner in ONE query
        xp_sums_result = await session.exec(
            select(XPTransaction.partner_id, func.sum(XPTransaction.amount).label("total"))
            .group_by(XPTransaction.partner_id)
        )
        xp_sums = {row.partner_id: float(row.total or 0) for row in xp_sums_result.all()}

        # 3. Bulk aggregate Balance sums per partner in ONE query
        bal_sums_result = await session.exec(
            select(Earning.partner_id, func.sum(Earning.amount).label("total"))
            .where(Earning.currency == "USDT")
            .group_by(Earning.partner_id)
        )
        bal_sums = {row.partner_id: float(row.total or 0) for row in bal_sums_result.all()}

        # 4. Compare in memory — zero additional DB queries
        flags = 0
        for p_id, p_tg_id, p_xp, p_balance in partners:
            xp_sum = xp_sums.get(p_id, 0.0)
            bal_sum = bal_sums.get(p_id, 0.0)

            if abs(float(p_xp) - xp_sum) > 0.01:
                logger.warning(f"⚠️ XP Discrepancy for {p_tg_id}: DB={p_xp}, Sum={xp_sum}")
                await audit_service.log_event(
                    session=session,
                    entity_type="system",
                    entity_id=str(p_tg_id),
                    action="integrity_discrepancy",
                    details={"type": "XP", "db_value": float(p_xp), "sum_value": xp_sum, "diff": float(p_xp) - xp_sum}
                )
                flags += 1

            if abs(float(p_balance) - bal_sum) > 0.01:
                logger.warning(f"⚠️ Balance Discrepancy for {p_tg_id}: DB={p_balance}, Sum={bal_sum}")
                await audit_service.log_event(
                    session=session,
                    entity_type="system",
                    entity_id=str(p_tg_id),
                    action="integrity_discrepancy",
                    details={"type": "BALANCE", "db_value": float(p_balance), "sum_value": bal_sum, "diff": float(p_balance) - bal_sum}
                )
                flags += 1

        if flags > 0:
            await session.commit()
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
