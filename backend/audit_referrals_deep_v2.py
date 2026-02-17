import asyncio
import logging
import os
import sys

# EXPLICIT CONFIG FOR AUDIT
DB_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner

# Force logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("deep_audit")

async def deep_audit():
    logger.info("🚀 Starting Deep Referral & Growth Audit...")
    
    # Use explicit URL to bypass .env access issues for this audit
    test_engine = create_async_engine(DB_URL)
    test_session_maker = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with test_session_maker() as session:
        # 1. Total Partners
        total_stmt = select(func.count(Partner.id))
        total = (await session.exec(total_stmt)).one()
        logger.info(f"Total Partners in Database: {total}")
        
        # 2. Check for missing paths (should be 0 for anyone with a referrer)
        missing_path_stmt = select(Partner).where(Partner.referrer_id.is_not(None)).where(Partner.path.is_(None))
        missing_path_partners = (await session.exec(missing_path_stmt)).all()
        logger.info(f"Partners with referrer but MISSING path: {len(missing_path_partners)}")
        
        # 3. Check Consistency of referral_count (Materialized total)
        # We check everyone since the database is small (~216 partners)
        logger.info("Checking consistency of referral_count for all partners...")
        all_partners_stmt = select(Partner)
        all_partners = (await session.exec(all_partners_stmt)).all()
        
        mismatches = []
        for p in all_partners:
            # Materialized Path check: everyone whose path starts with this user's path + id
            # actually, search_path for children is "parent.path.id"
            search_path = f"{p.path or ''}.{p.id}".lstrip(".")
            
            # Count actual direct children (L1)
            l1_actual_stmt = select(func.count(Partner.id)).where(Partner.referrer_id == p.id)
            l1_actual = (await session.exec(l1_actual_stmt)).one()
            
            # Count total downline (all levels)
            downline_actual_stmt = select(func.count(Partner.id)).where(
                (Partner.path == search_path) | (Partner.path.like(f"{search_path}.%"))
            )
            downline_actual = (await session.exec(downline_actual_stmt)).one()
            
            if p.referral_count != downline_actual:
                mismatches.append({
                    "id": p.id,
                    "username": p.username,
                    "stored": p.referral_count,
                    "actual_l1": l1_actual,
                    "total_downline": downline_actual
                })

        if not mismatches:
            logger.info("✅ SUCCESS: All referral_count values match actual L1 children.")
        else:
            logger.warning(f"⚠️ FOUND {len(mismatches)} MISMATCHES in referral_count:")
            for m in mismatches[:10]: # show first 10
                logger.warning(f"  User {m['id']} (@{m['username']}): Stored={m['stored']}, Actual L1={m['actual_l1']}, Total Downline={m['total_downline']}")
            if len(mismatches) > 10:
                logger.warning(f"  ... and {len(mismatches) - 10} more.")

        # 4. Check for XP Consistency (simple check)
        logger.info("Checking for partners with 0 XP but high referral count...")
        silent_leaders_stmt = select(Partner).where(Partner.xp == 0).where(Partner.referral_count > 0)
        silent_leaders = (await session.exec(silent_leaders_stmt)).all()
        if silent_leaders:
            logger.warning(f"⚠️ Found {len(silent_leaders)} partners with 0 XP but > 0 referrals. Referral logic might have missed them.")
        else:
            logger.info("✅ XP distribution for referrals appears healthy.")

    await test_engine.dispose()
    logger.info("🏁 Audit Finished.")

if __name__ == "__main__":
    try:
        asyncio.run(deep_audit())
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        sys.exit(1)
