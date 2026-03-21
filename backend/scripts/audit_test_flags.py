import asyncio
import logging
from sqlmodel import select, func, text
from app.models.partner import Partner, async_session_maker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def audit_test_flags():
    async with async_session_maker() as session:
        logger.info("🧪 Auditing 'is_test' flags in Database...")
        
        # 1. Check total counts
        stmt_total = select(func.count(Partner.id))
        total_users = (await session.execute(stmt_total)).scalar() or 0
        
        stmt_test = select(func.count(Partner.id)).where(Partner.is_test == True)
        test_users = (await session.execute(stmt_test)).scalar() or 0
        
        stmt_real = select(func.count(Partner.id)).where(Partner.is_test == False)
        real_users = (await session.execute(stmt_real)).scalar() or 0
        
        logger.info(f"📊 Total Users: {total_users}")
        logger.info(f"🧪 Test Users (HIDDEN): {test_users}")
        logger.info(f"✅ Real Users (VISIBLE): {real_users}")
        
        if test_users > 0:
            logger.warning(f"⚠️ Found {test_users} users marked as 'is_test'! These are HIDDEN from analytics.")
            
            # Check for non-test users who might have been accidentally marked
            # (e.g. they have referrals but are marked as test)
            stmt_suspicious = select(Partner).where(Partner.is_test == True, Partner.referral_count > 0)
            suspicious = (await session.exec(stmt_suspicious)).all()
            
            if suspicious:
                logger.warning(f"🚨 ALERT: Found {len(suspicious)} suspicious TEST users with non-zero referrals!")
                for s in suspicious:
                    logger.info(f"  - User {s.id} (@{s.username}): referrals={s.referral_count}")
        
        # Check if the user's current account is test?
        # (Need their TG ID for this)

if __name__ == "__main__":
    asyncio.run(audit_test_flags())
