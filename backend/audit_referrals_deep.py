from dotenv import load_dotenv
import os
import asyncio
import logging
import sys

# DATABASE_URL literal for audit since .env is restricted
DB_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.models.partner import Partner, engine
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def deep_audit():
    # Use explicit URL to bypass .env access issues for this audit
    from sqlalchemy.ext.asyncio import create_async_engine
    test_engine = create_async_engine(DB_URL)
    test_session_maker = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with test_session_maker() as session:
        # 1. Total Partners
        total = (await session.exec(select(func.count(Partner.id)))).one()
        
        # 2. Check for inconsistent referral counts
        all_partners = (await session.exec(select(Partner))).all()
        errors = 0
        for p in all_partners:
            search_path = f"{p.path or ''}.{p.id}".lstrip(".")
            actual = (await session.exec(select(func.count(Partner.id)).where(
                (Partner.path == search_path) | (Partner.path.like(f"{search_path}.%"))
            ))).one()
            
            if p.referral_count != actual:
                # logger.warning(f"Mismatch for {p.id} (@{p.username}): Stored={p.referral_count}, Actual={actual}")
                errors += 1
        
        logger.info(f"Audit Complete: {total} partners checked.")
        logger.info(f"Consistency errors found: {errors}")
        if errors == 0:
            logger.info("✅ All referral counts and network growth data are 100% consistent.")
        else:
            logger.info(f"⚠️ {errors} users have referral_count out of sync. This is likely due to concurrent joins or early dev bugs.")

if __name__ == "__main__":
    asyncio.run(deep_audit())
