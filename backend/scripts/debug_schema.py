
import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def verify():
    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=True, future=True)

    async with engine.connect() as conn:
        print("🔍 Debugging table 'earning'...")
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'earning'"))
        cols = [r[0] for r in res]
        print(f"👉 Columns found for 'earning' (lowercase): {cols}")

        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'Earning'"))
        cols = [r[0] for r in res]
        print(f"👉 Columns found for 'Earning' (CapCase): {cols}")

        print("\n🔍 Debugging all tables...")
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [r[0] for r in res]
        print(f"👉 Tables found: {tables}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify())
