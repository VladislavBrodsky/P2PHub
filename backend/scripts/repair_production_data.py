import asyncio
import logging
from sqlmodel import select, text
from app.models.partner import Partner, async_session_maker
from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def repair_data():
    async with async_session_maker() as session:
        logger.info("🛠️ Starting Production Data REPAIR...")
        
        # 1. Clear is_test for any user with referrals or balance
        # (Real users should never be hidden)
        stmt_repair = select(Partner).where(Partner.is_test == True, (Partner.referral_count > 0) | (Partner.total_earned_usdt > 0) | (Partner.balance > 0))
        to_repair = (await session.exec(stmt_repair)).all()
        
        if to_repair:
            logger.info(f"🔄 Repairing {len(to_repair)} users mistakenly marked as test...")
            for p in to_repair:
                logger.info(f"  - Fixing User {p.id} (@{p.username})")
                p.is_test = False
                session.add(p)
            await session.commit()
        else:
            logger.info("✨ No real users found mistakenly marked as test.")

        # 2. Final Global Recalculation (Re-run for safety)
        # (This is a simplified version of restore_production_stats.py)
        logger.info("📊 Re-calculating all stats...")
        stmt_all = select(Partner).where(Partner.is_test == False)
        all_partners = (await session.exec(stmt_all)).all()
        
        for p in all_partners:
            my_search_path = f"{p.path or ''}.{p.id}".lstrip(".")
            count_stmt = text("SELECT COUNT(*) FROM partner WHERE (path = :p OR path LIKE :pw) AND is_test = false")
            actual_count = (await session.execute(count_stmt, {"p": my_search_path, "pw": f"{my_search_path}.%"})).scalar() or 0
            
            p.referral_count = actual_count
            session.add(p)
            
        await session.commit()
        logger.info("✅ Global stats recalculated.")

        # 3. Global Cache Clear
        logger.info("🧹 Clearing Redis Cache (FLUSH ALL) to remove stale 'zero' profiles...")
        await redis_service.client.flushdb()
        logger.info("✅ Redis Cache cleared.")

if __name__ == "__main__":
    asyncio.run(repair_data())
