
import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def check():
    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=False, future=True)

    async with engine.connect() as conn:
        print("📊 XP Transactions for @uslincoln (ID: 1):")
        res = await conn.execute(text("SELECT type, amount, description, created_at FROM xptransaction WHERE partner_id = 1 ORDER BY created_at DESC LIMIT 20"))
        for r in res:
            print(f"   [{r[3]}] {r[0]}: {r[1]} XP - {r[2]}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
