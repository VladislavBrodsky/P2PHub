"""
Backfill photo_file_id for existing partners.
This script fetches Telegram file_ids for users who don't have them yet.
"""
import asyncio
import logging

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from aiogram import Bot
from sqlmodel import select

from app.core.config import settings
from app.models.partner import Partner, get_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=settings.BOT_TOKEN)

async def backfill_photo_file_ids():
    """Fetch and save photo_file_id for partners who don't have them."""

    async for session in get_session():
        # Get all partners without photo_file_id
        statement = select(Partner).where(Partner.photo_file_id is None)
        result = await session.exec(statement)
        partners = result.all()

        logger.info(f"Found {len(partners)} partners without photo_file_id")

        updated_count = 0
        skipped_count = 0

        for partner in partners:
            try:
                user_id = int(partner.telegram_id)
                logger.info(f"Processing partner {partner.id} (TG: {user_id}, Name: {partner.first_name})")

                # Fetch profile photo from Telegram
                user_photos = await bot.get_user_profile_photos(user_id, limit=1)

                if user_photos.total_count > 0:
                    # Get the file_id (no need to download)
                    file_id = user_photos.photos[0][0].file_id

                    partner.photo_file_id = file_id
                    session.add(partner)
                    updated_count += 1
                    logger.info(f"✅ Updated photo_file_id for {partner.first_name}: {file_id[:20]}...")
                else:
                    logger.info(f"ℹ️  No profile photo available for {partner.first_name}")
                    skipped_count += 1

            except Exception as e:
                logger.error(f"❌ Error processing partner {partner.id}: {e}")
                skipped_count += 1
                continue

        await session.commit()
        logger.info("\n🎉 Backfill complete!")
        logger.info(f"   ✅ Updated: {updated_count}")
        logger.info(f"   ⏭️  Skipped: {skipped_count}")
        logger.info(f"   📊 Total processed: {len(partners)}")

if __name__ == "__main__":
    asyncio.run(backfill_photo_file_ids())
