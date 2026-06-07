import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from sqlmodel import select
from app.models.partner import Partner, get_session

async def check():
    async for session in get_session():
        stmt = select(Partner).where(Partner.username.ilike("%uslincoln%"))
        res = await session.exec(stmt)
        partners = res.all()
        print(f"Found {len(partners)} partners matching 'uslincoln':")
        for p in partners:
            print(f"ID: {p.id}, Username: {p.username}, TG ID: {p.telegram_id}, Is Pro: {p.is_pro}")
        break

if __name__ == "__main__":
    asyncio.run(check())
