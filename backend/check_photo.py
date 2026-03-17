import asyncio
import sys

from sqlmodel import select

from app.models.partner import Partner, async_session_maker
from app.services.partner_service import sync_single_photo_background
from bot import bot


async def main():
    username = "PAO_Web3"
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username == username)
        partner = (await session.exec(stmt)).first()
        
        if not partner:
            print(f"Partner @{username} not found")
            return
            
        print(f"Current photo_file_id: {partner.photo_file_id}")
        await sync_single_photo_background(partner.telegram_id)
        print("Triggered sync_single_photo_background")

if __name__ == "__main__":
    asyncio.run(main())
