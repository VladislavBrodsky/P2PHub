import asyncio
import logging
from bot import bot
from app.core.config import settings
from app.services.partner_service import ensure_photo_cached, _get_photo_url
from app.models.partner import async_session_maker, Partner
from app.services.redis_service import redis_service
from sqlmodel import select

logging.basicConfig(level=logging.ERROR)

async def main():
    async with async_session_maker() as session:
        # Get recent partners with photo_file_id
        stmt = select(Partner).where(Partner.photo_file_id != None).order_by(Partner.created_at.desc()).limit(5)
        partners = (await session.exec(stmt)).all()
        for p in partners:
            print(f"Partner {p.id} ({p.telegram_id}): {p.photo_file_id}")
            res = await ensure_photo_cached(p.photo_file_id, force_refresh=True)
            if not res:
                print(f"-> Failed to get photo for {p.id}")
                # check why
                url = await _get_photo_url(p.photo_file_id, "test_cache_key")
                print(f"-> URL from Telegram: {url}")
            else:
                print(f"-> Success for {p.id}, {len(res)} bytes")
            print("---")
            
        await redis_service.close()

if __name__ == "__main__":
    asyncio.run(main())
