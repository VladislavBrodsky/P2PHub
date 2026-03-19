import asyncio
import logging
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, get_session
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_db():
    test_tg_id = "716720099" # uslincoln
    logger.info(f"Checking DB for {test_tg_id}...")
    
    async for session in get_session():
        stmt = select(Partner).where(Partner.telegram_id == test_tg_id)
        result = await session.exec(stmt)
        partner = result.first()
        
        if partner:
            logger.info(f"Partner found in DB: {partner.username}")
            logger.info(f"XP: {partner.xp}")
            logger.info(f"Plan: {partner.subscription_plan}")
            logger.info(f"Balance: {partner.balance}")
            logger.info(f"Referral Count: {partner.referral_count}")
        else:
            logger.info("Partner NOT FOUND in DB!")
        break # Only check once

if __name__ == "__main__":
    asyncio.run(check_db())
