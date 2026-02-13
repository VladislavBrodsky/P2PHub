
import logging
from datetime import datetime, timedelta
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models.partner import Partner, engine

logger = logging.getLogger(__name__)

async def reconcile_network_stats():
    """
    Background worker to ensure database structural integrity.
    Reconciles path, depth, and referral_count for all users.
    Optimized to run during low-traffic periods.
    """
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    try:
        async with async_session() as session:
            logger.info("🔧 Starting Network Stats Reconciliation...")
            
            # 1. Fetch all partners
            result = await session.exec(select(Partner))
            partners = result.all()
            partner_map = {p.id: p for p in partners}
            
            updates = 0
            
            for p in partners:
                # Calculate correct path and depth
                correct_path = []
                correct_depth = 0
                curr = p
                
                # Trace back to root
                visited = set()
                while curr.referrer_id and curr.referrer_id not in visited:
                    visited.add(curr.referrer_id)
                    parent = partner_map.get(curr.referrer_id)
                    if not parent: break
                    correct_path.insert(0, str(parent.id))
                    correct_depth += 1
                    curr = parent
                
                path_str = ".".join(correct_path) if correct_path else None
                
                # Update if different
                if p.path != path_str or p.depth != correct_depth:
                    logger.info(f"Fixing structure for {p.username} (ID: {p.id})")
                    p.path = path_str
                    p.depth = correct_depth
                    session.add(p)
                    updates += 1

            if updates > 0:
                await session.commit()
                logger.info(f"✅ Fixed {updates} path/depth inconsistencies.")

            # 2. Reconcile Referral Counts (Expensive, but accurate)
            # Only do this if we are not in a strict real-time constraint
            logger.info("📊 Reconciling referral counts...")
            count_updates = 0
            for p in partners:
                search_path = f"{p.path or ''}.{p.id}".lstrip(".")
                
                # Count all descendants in the 9-level matrix
                count_query = text("""
                    SELECT count(*) FROM partner 
                    WHERE (path = :sp OR path LIKE :sw)
                    AND depth BETWEEN :min_d AND :max_d
                """)
                res = await session.execute(count_query, {
                    "sp": search_path,
                    "sw": f"{search_path}.%",
                    "min_d": p.depth + 1,
                    "max_d": p.depth + 9
                })
                real_count = res.scalar() or 0
                
                if p.referral_count != real_count:
                    logger.info(f"Reconciled count for {p.username}: {p.referral_count} -> {real_count}")
                    p.referral_count = real_count
                    session.add(p)
                    count_updates += 1
            
            if count_updates > 0:
                await session.commit()
                logger.info(f"✅ Reconciled {count_updates} referral counts.")
            
            logger.info("✨ Network Stats Reconciliation Complete.")
            
    except Exception as e:
        logger.error(f"❌ Critical Error in reconciliation: {e}", exc_info=True)

async def check_database_health() -> dict:
    """
    Rapid health check for database performance and integrity.
    """
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # Check connection speed
        start = datetime.utcnow()
        await session.execute(text("SELECT 1"))
        latency_ms = (datetime.utcnow() - start).total_seconds() * 1000
        
        # Check for any orphaned partners
        res_orphaned = await session.execute(text("SELECT count(*) FROM partner WHERE referrer_id IS NOT NULL AND path IS NULL"))
        orphaned_count = res_orphaned.scalar() or 0
        
        return {
            "status": "healthy" if orphaned_count == 0 else "degraded",
            "latency_ms": round(latency_ms, 2),
            "orphaned_count": orphaned_count,
            "timestamp": datetime.utcnow().isoformat()
        }
