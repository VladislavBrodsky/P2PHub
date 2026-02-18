import asyncio
import logging
import os
import sys

# EXPLICIT CONFIG
DB_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("sync_totals")

async def sync_totals():
    logger.info("🛠 Starting Global Totals Synchronization...")
    
    test_engine = create_async_engine(DB_URL)
    test_session_maker = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with test_session_maker() as session:
        # Fetch all partners
        all_partners = (await session.exec(select(Partner))).all()
        logger.info(f"Processing {len(all_partners)} partners...")
        
        updates = 0
        for p in all_partners:
            # 1. Recalculate Network Size (All levels up to 9)
            # The UI calls this "Network Size", DB has it as "referral_count"
            search_path = f"{p.path or ''}.{p.id}".lstrip(".")
            actual_downline = (await session.exec(select(func.count(Partner.id)).where(
                (Partner.path == search_path) | (Partner.path.like(f"{search_path}.%"))
            ))).one()
            
            # 2. Recalculate Total Earned USDT
            from app.models.partner import Earning
            actual_earned = (await session.exec(select(func.sum(Earning.amount)).where(
                Earning.partner_id == p.id,
                Earning.currency == "USDT"
            ))).one() or 0.0
            
            if p.referral_count != actual_downline or abs(p.total_earned_usdt - actual_earned) > 0.001:
                # logger.info(f"Syncing User {p.id}: RefCount {p.referral_count}->{actual_downline}, Earned {p.total_earned_usdt}->{actual_earned}")
                p.referral_count = actual_downline
                p.total_earned_usdt = float(actual_earned)
                session.add(p)
                updates += 1
        
        if updates > 0:
            await session.commit()
            logger.info(f"✅ Successfully synchronized totals for {updates} partners.")
        else:
            logger.info("✨ Everything is already in sync!")

    await test_engine.dispose()

if __name__ == "__main__":
    asyncio.run(sync_totals())
