"""
Backfill profile photos for existing partners.
This script downloads Telegram profile photos for users who don't have them yet.
"""
import asyncio
import logging
from aiogram import Bot
from app.core.config import settings
from app.models.partner import Partner, get_session
from app.services.image_service import image_service
from sqlmodel import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=settings.BOT_TOKEN)

async def backfill_photos():
    """Download and save profile photos for partners who don't have them."""
    
    async for session in get_session():
        # Get all partners without photo_urls or with telegram URLs
        statement = select(Partner).where(
            (Partner.photo_url == None) | (Partner.photo_url.like('%api.telegram.org%'))
        )
        result = await session.exec(statement)
        partners = result.all()
        
        logger.info(f"Found {len(partners)} partners without local profile photos")
        
        updated_count = 0
        for partner in partners:
            try:
                user_id = int(partner.telegram_id)
                logger.info(f"Processing partner {partner.id} (TG: {user_id}, Name: {partner.first_name})")
                
                # Fetch profile photo from Telegram
                user_photos = await bot.get_user_profile_photos(user_id, limit=1)
                
                if user_photos.total_count > 0:
                    # Download the photo
                    file = await bot.get_file(user_photos.photos[0][0].file_id)
                    temp_url = f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file.file_path}"
                    
                    # Convert and save locally
                    local_url = await image_service.download_and_convert_to_webp(temp_url, partner.telegram_id)
                    
                    if local_url:
                        partner.photo_url = local_url
                        session.add(partner)
                        updated_count += 1
                        logger.info(f"✅ Updated photo for {partner.first_name}: {local_url}")
                    else:
                        logger.warning(f"⚠️ Failed to download photo for {partner.first_name}")
                else:
                    logger.info(f"ℹ️ No profile photo available for {partner.first_name}")
                    
            except Exception as e:
                logger.error(f"❌ Error processing partner {partner.id}: {e}")
                continue
        
        await session.commit()
        logger.info(f"\n🎉 Backfill complete! Updated {updated_count}/{len(partners)} partners")

if __name__ == "__main__":
    asyncio.run(backfill_photos())
