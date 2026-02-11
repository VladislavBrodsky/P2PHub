
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def check():
    engine = create_async_engine('postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway', echo=False, future=True)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT telegram_id FROM partner WHERE username = 'uslincoln'"))
        row = res.first()
        print(f"TELEGRAM_ID:{row[0] if row else 'NOT_FOUND'}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
