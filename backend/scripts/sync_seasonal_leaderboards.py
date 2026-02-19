import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import Partner, get_session
from app.services.leaderboard_service import leaderboard_service
from sqlmodel import select
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def sync_seasonal():
    """
    Backfills Weekly and Monthly leaderboards from Partner.xp.
    This creates an initial competitive baseline.
    """
    logger.info("🚀 Starting Seasonal Leaderboard Sync...")
    count = 0
    async for session in get_session():
        # Get all partners with XP
        statement = select(Partner).where(Partner.xp > 0)
        result = await session.exec(statement)
        partners = result.all()
        
        logger.info(f"📊 Found {len(partners)} partners to sync.")
        
        for p in partners:
            # update_score now updates ALL active keys (Global, Monthly, Weekly)
            await leaderboard_service.update_score(p.id, p.xp)
            count += 1
            if count % 100 == 0:
                logger.info(f"✅ Synced {count} partners...")
                
    logger.info(f"✨ DONE! Synced {count} partners to seasonal leaderboards.")

if __name__ == "__main__":
    asyncio.run(sync_seasonal())
