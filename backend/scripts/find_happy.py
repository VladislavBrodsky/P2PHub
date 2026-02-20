import asyncio
import os
import sys

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from sqlmodel import select

from app.models.partner import Partner, async_session_maker


async def main():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.first_name == "Happy")
        res = await session.exec(stmt)
        for p in res.all():
            print(f"ID: {p.id} Name: {p.first_name} {p.last_name} username: {p.username} photo_file_id: {p.photo_file_id} photo_url: {p.photo_url}")

if __name__ == "__main__":
    asyncio.run(main())
