import asyncio
from bot import bot
from app.core.config import settings
from app.services.partner_service import ensure_photo_cached, _get_photo_url
from app.models.partner import async_session_maker, Partner
from sqlmodel import select

async def main():
    async with async_session_maker() as session:
        # Get latest partner with photo_file_id
        stmt = select(Partner).where(Partner.photo_file_id != None).order_by(Partner.created_at.desc()).limit(10)
        partners = (await session.exec(stmt)).all()
        for p in partners:
            print(f"Partner {p.id}: {p.photo_file_id}")
            res = await ensure_photo_cached(p.photo_file_id, force_refresh=True)
            if not res:
                print(f"Failed to get photo for {p.id}")
            else:
                print(f"Success for {p.id}, {len(res)} bytes")
                break

asyncio.run(main())
