
import asyncio
from sqlmodel import select
from app.models.partner import SystemSetting, engine
from sqlmodel.ext.asyncio.session import AsyncSession
import json

async def check_settings():
    async with AsyncSession(engine) as session:
        stmt = select(SystemSetting)
        res = await session.exec(stmt)
        settings = res.all()
        for s in settings:
            print(f"Key: {s.key}, Value: {s.value}")

if __name__ == "__main__":
    asyncio.run(check_settings())
