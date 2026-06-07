import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from sqlmodel import select
from app.models.partner import Partner, get_session

async def check():
    async for session in get_session():
        stmt = select(Partner).where(Partner.telegram_id == "537873096")
        res = await session.exec(stmt)
        p = res.first()
        if p:
            print(f"Found partner by TG ID 537873096:")
            print(f"ID: {p.id}, Username: {p.username}, TG ID: {p.telegram_id}, Is Pro: {p.is_pro}")
        else:
            print("No partner found with TG ID 537873096")
        break

if __name__ == "__main__":
    asyncio.run(check())
