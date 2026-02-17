
import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import sessionmaker
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner, engine
from app.worker import broker

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
        from scripts.archive.restore_names_from_telegram import restore_names_from_telegram
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
    start_time = datetime.utcnow()
    
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

    duration = (datetime.utcnow() - start_time).total_seconds()
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
            for anc_id in anc_ids[-9:]:
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
    
    cutoff = datetime.utcnow() - timedelta(hours=48)
    
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
        start = datetime.utcnow()
        await session.execute(text("SELECT 1"))
        latency_ms = (datetime.utcnow() - start).total_seconds() * 1000
        
        res_orphaned = await session.execute(text("SELECT count(*) FROM partner WHERE referrer_id IS NOT NULL AND path IS NULL"))
        orphaned_count = res_orphaned.scalar() or 0
        
        return {
            "status": "healthy" if orphaned_count == 0 else "degraded",
            "latency_ms": round(latency_ms, 2),
            "orphaned_count": orphaned_count,
            "timestamp": datetime.utcnow().isoformat()
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
