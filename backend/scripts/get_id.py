
import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def check():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL not set")
        return
    engine = create_async_engine(db_url, echo=False, future=True)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT telegram_id FROM partner WHERE username = 'uslincoln'"))
        row = res.first()
        print(f"TELEGRAM_ID:{row[0] if row else 'NOT_FOUND'}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
