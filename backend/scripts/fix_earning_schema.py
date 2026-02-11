
import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Hardcode environment variables
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def fix_schema():
    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=True, future=True)

    print("🚀 Checking and fixing 'earning' table schema...")

    async with engine.begin() as conn:
        # Check current columns
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'earning'"))
        cols = [r[0] for r in res]
        print(f"   Current columns: {cols}")

        # Add 'type' if missing
        if 'type' not in cols:
            print("   ➕ Adding 'type' column...")
            await conn.execute(text("ALTER TABLE earning ADD COLUMN type VARCHAR DEFAULT 'COMMISSION'"))
            await conn.execute(text("CREATE INDEX ix_earning_type ON earning (type)"))

        # Add 'level' if missing
        if 'level' not in cols:
            print("   ➕ Adding 'level' column...")
            await conn.execute(text("ALTER TABLE earning ADD COLUMN level INTEGER"))

        # Add 'currency' if missing
        if 'currency' not in cols:
            print("   ➕ Adding 'currency' column...")
            await conn.execute(text("ALTER TABLE earning ADD COLUMN currency VARCHAR DEFAULT 'USDT'"))

        # Check 'created_at' index
        if 'created_at' in cols:
             # Just in case, try to create index
             try:
                 await conn.execute(text("CREATE INDEX ix_earning_created_at ON earning (created_at)"))
             except Exception:
                 pass

    print("✅ Schema fix completed.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_schema())
