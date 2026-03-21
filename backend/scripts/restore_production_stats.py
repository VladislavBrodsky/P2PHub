import asyncio
import logging
from datetime import UTC, datetime
from typing import Dict, List

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.partner import Partner, Earning, engine, async_session_maker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def restore_lineage():
    """Recalculates path and depth for all users based on referrer_id."""
    async with async_session_maker() as session:
        logger.info("📐 Starting GLOBAL Lineage Restoration...")
        
        # 1. Fetch all partners
        stmt = select(Partner).order_by(Partner.id)
        result = await session.exec(stmt)
        partners = {p.id: p for p in result.all()}
        
        # 2. Iteratively build paths
        changed_count = 0
        for p_id, p in partners.items():
            old_path = p.path
            old_depth = p.depth
            
            if not p.referrer_id:
                p.path = None
                p.depth = 0
            else:
                # Find parent
                parent = partners.get(p.referrer_id)
                if parent:
                    # Recursive path build (simplified)
                    p.path = f"{parent.path or ''}.{parent.id}".lstrip(".")
                    p.depth = (parent.depth or 0) + 1
                else:
                    # Orphan with referrer_id? Should not happen often.
                    p.path = None
                    p.depth = 0
            
            if p.path != old_path or p.depth != old_depth:
                session.add(p)
                changed_count += 1
        
        if changed_count > 0:
            await session.commit()
            logger.info(f"✅ Repaired lineage for {changed_count} users.")
        else:
            logger.info("✨ Lineage is already consistent.")

async def restore_stats():
    """Recalculates referral_count and total_earned_usdt for all users."""
    async with async_session_maker() as session:
        logger.info("📊 Starting GLOBAL Stats Restoration...")
        
        stmt = select(Partner).where(Partner.is_test == False)
        result = await session.exec(stmt)
        partners = result.all()
        
        for p in partners:
            # A. Referral Count (Network Size)
            my_search_path = f"{p.path or ''}.{p.id}".lstrip(".")
            count_stmt = text("SELECT COUNT(*) FROM partner WHERE (path = :p OR path LIKE :pw) AND is_test = false")
            actual_count = (await session.execute(count_stmt, {"p": my_search_path, "pw": f"{my_search_path}.%"})).scalar() or 0
            
            # B. Total Earned (USDT)
            earned_stmt = text("SELECT COALESCE(SUM(amount), 0) FROM earning WHERE partner_id = :pid AND currency = 'USDT' AND amount > 0")
            actual_earned = (await session.execute(earned_stmt, {"pid": p.id})).scalar() or 0.0
            
            if p.referral_count != actual_count or abs(p.total_earned_usdt - actual_earned) > 0.01:
                logger.info(f"🔄 Repairing {p.id}: Count {p.referral_count}->{actual_count}, Earned {p.total_earned_usdt}->{actual_earned}")
                p.referral_count = actual_count
                p.total_earned_usdt = actual_earned
                session.add(p)
        
        await session.commit()
        logger.info("✅ Stats restoration complete.")

async def main():
    await restore_lineage()
    await restore_stats()

if __name__ == "__main__":
    asyncio.run(main())
