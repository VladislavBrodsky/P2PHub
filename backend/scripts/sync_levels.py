import asyncio
import logging
import sys
from pathlib import Path
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))

from app.models.partner import Partner, engine
from app.utils.ranking import get_level
from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def sync_levels():
    async with AsyncSession(engine) as session:
        statement = select(Partner)
        result = await session.exec(statement)
        partners = result.all()
        
        logger.info(f"Starting Level Sync for {len(partners)} partners...")
        
        updated_count = 0
        for p in partners:
            correct_level = get_level(p.xp)
            if p.level != correct_level:
                logger.info(f"UPDATING: @{p.username or p.telegram_id} | Old Level: {p.level} | New Level: {correct_level} | XP: {p.xp}")
                p.level = correct_level
                session.add(p)
                updated_count += 1
            
            # #comment Force flush of the Me stats cache to fix 'Wooden' display bugs
            try:
                # We clear all 3 timeframes
                for tf in ["all", "monthly", "weekly"]:
                    cache_key = f"leaderboard:me:v2:{tf}:{p.telegram_id}"
                    await redis_service.delete(cache_key)
                
                # Also clear profile cache
                await redis_service.delete(f"partner:profile:v5:{p.telegram_id}")
            except Exception as e:
                logger.warning(f"Cache clear failed for {p.telegram_id}: {e}")

        if updated_count > 0:
            await session.commit()
            logger.info(f"✅ Level Sync Complete. Updated {updated_count} partners.")
        else:
            logger.info("✅ Level Sync Complete. No updates needed.")

if __name__ == "__main__":
    asyncio.run(sync_levels())
