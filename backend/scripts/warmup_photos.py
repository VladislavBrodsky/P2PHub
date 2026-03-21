import asyncio
import logging
from sqlmodel import select
from app.models.partner import Partner, async_session_maker
from app.services.partner_service import ensure_photo_cached

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def warmup_photos():
    async with async_session_maker() as session:
        logger.info("📸 Starting Production Photo Warm-up...")
        
        # 1. Fetch all real partners with a photo_file_id
        stmt = select(Partner.photo_file_id).where(Partner.is_test == False, Partner.photo_file_id.is_not(None))
        result = await session.execute(stmt)
        file_ids = [row[0] for row in result.all()]
        
        if not file_ids:
            logger.info("✨ No photos found to warm up.")
            return
            
        logger.info(f"🔥 Found {len(file_ids)} photos. Starting batch optimization...")
        
        # 2. Process in chunks to avoid overwhelming the Telegram API/Bot
        chunk_size = 10
        for i in range(0, len(file_ids), chunk_size):
            chunk = file_ids[i:i+chunk_size]
            logger.info(f"  - Processing chunk {i//chunk_size + 1}/{(len(file_ids)//chunk_size)+1}...")
            await asyncio.gather(*[ensure_photo_cached(fid) for fid in chunk if fid])
            # Small sleep to follow Telegram's cooperative limits
            await asyncio.sleep(0.5)
            
        logger.info("✅ All production photos are now optimized and cached in Redis.")

if __name__ == "__main__":
    asyncio.run(warmup_photos())
