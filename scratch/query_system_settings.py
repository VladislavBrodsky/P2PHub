import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from sqlmodel import select
from app.models.partner import SystemSetting, get_session

async def check():
    async for session in get_session():
        stmt = select(SystemSetting)
        res = await session.exec(stmt)
        settings = res.all()
        print(f"Found {len(settings)} system settings:")
        for s in settings:
            print(f"Key: {s.key}, Value: {s.value}")
        break

if __name__ == "__main__":
    asyncio.run(check())
