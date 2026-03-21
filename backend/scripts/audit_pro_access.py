import asyncio
import logging
from sqlmodel import select
from app.models.partner import Partner, async_session_maker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def audit_pro_access():
    async with async_session_maker() as session:
        # 1. Total PRO counts
        stmt_pro = select(Partner).where(Partner.is_pro == True)
        res_pro = await session.exec(stmt_pro)
        pro_users = res_pro.all()
        
        logger.info(f"💎 Total PRO Users Found: {len(pro_users)}")
        
        # 2. Check for discrepancies (Plan set but is_pro False)
        stmt_disc = select(Partner).where(Partner.subscription_plan != None).where(Partner.is_pro == False)
        res_disc = await session.exec(stmt_disc)
        discrepancies = res_disc.all()
        
        if discrepancies:
            logger.warning(f"🚨 FOUND {len(discrepancies)} USERS WITH PLAN BUT NO PRO FLAG!")
            for u in discrepancies:
                logger.warning(f"  - User {u.id} (@{u.username}): Plan={u.subscription_plan}, is_pro={u.is_pro}")
        else:
            logger.info("✅ No plan-flag discrepancies found.")

        # 3. Check PRO+ logic
        pro_plus_count = sum(1 for u in pro_users if u.is_pro_plus)
        logger.info(f"💎 Total PRO+ Users Found: {pro_plus_count}")

        # 4. Check Viral Studio Tokens
        low_token_users = [u for u in pro_users if u.pro_tokens < 5]
        if low_token_users:
            logger.info(f"ℹ️ Users with < 5 tokens: {len(low_token_users)}")

if __name__ == "__main__":
    asyncio.run(audit_pro_access())
