import os
from dotenv import load_dotenv

# Diagnostics
cwd = os.getcwd()
env_path = os.path.join(cwd, ".env")
print(f"DEBUG: CWD={cwd}")
print(f"DEBUG: .env exists at {env_path}: {os.path.exists(env_path)}")

# Load environment variables
success = load_dotenv(dotenv_path=env_path, override=True)
print(f"DEBUG: load_dotenv success: {success}")
print(f"DEBUG: DATABASE_URL in os.environ: {'DATABASE_URL' in os.environ}")

import asyncio
import logging
import sys

# Add the current directory to sys.path to import app
sys.path.append(cwd)

from app.models.partner import Partner, engine
from sqlmodel import select, func, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def audit_referrals():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # 1. Total Partners
        total_partners = (await session.exec(select(func.count(Partner.id)))).one()
        logger.info(f"Total Partners in DB: {total_partners}")

        # 2. Partners with missing path/depth
        missing_metadata = await session.exec(
            select(Partner).where(Partner.referrer_id.is_not(None)).where(Partner.path.is_(None))
        )
        missing_count = len(missing_metadata.all())
        logger.info(f"Partners with referrer but missing path: {missing_count}")

        # 3. Check Consistency of referral_count (Network Size)
        top_referrers_stmt = select(Partner).where(Partner.referral_count > 0).order_by(Partner.referral_count.desc()).limit(10)
        top_referrers = (await session.exec(top_referrers_stmt)).all()
        
        logger.info("Audit of Top 10 Referrers (Stored Count vs Tree Size):")
        for p in top_referrers:
            search_path = f"{p.path or ''}.{p.id}".lstrip(".")
            downline_stmt = select(func.count(Partner.id)).where(
                (Partner.path == search_path) | (Partner.path.like(f"{search_path}.%"))
            )
            downline_count = (await session.exec(downline_stmt)).one()
            logger.info(f"User {p.id} (@{p.username}): Stored Referral Count={p.referral_count}, Actual Downline={downline_count}")

if __name__ == "__main__":
    asyncio.run(audit_referrals())
