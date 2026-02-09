
import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def fix():
    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=True, future=True)
    
    async with engine.begin() as conn:
        print("🚀 Force adding columns to 'earning'...")
        try:
            await conn.execute(text("ALTER TABLE earning ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'COMMISSION'"))
            print("   ✅ 'type' added or exists.")
        except Exception as e:
            print(f"   ❌ Error adding 'type': {e}")

        try:
            await conn.execute(text("ALTER TABLE earning ADD COLUMN IF NOT EXISTS level INTEGER"))
            print("   ✅ 'level' added or exists.")
        except Exception as e:
            print(f"   ❌ Error adding 'level': {e}")

        try:
            await conn.execute(text("ALTER TABLE earning ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT 'USDT'"))
            print("   ✅ 'currency' added or exists.")
        except Exception as e:
            print(f"   ❌ Error adding 'currency': {e}")
            
        try:
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_earning_type ON earning (type)"))
            print("   ✅ index on 'type' added.")
        except Exception as e:
            print(f"   ❌ Error adding index on 'type': {e}")

        print("🚀 Creating 'xptransaction' table if missing...")
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS xptransaction (
                    id SERIAL PRIMARY KEY,
                    partner_id INTEGER NOT NULL REFERENCES partner(id),
                    amount FLOAT NOT NULL,
                    type VARCHAR NOT NULL,
                    description VARCHAR,
                    reference_id VARCHAR,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_xptransaction_partner_id ON xptransaction (partner_id)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_xptransaction_type ON xptransaction (type)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_xptransaction_reference_id ON xptransaction (reference_id)"))
            print("   ✅ 'xptransaction' table and indices created or exist.")
        except Exception as e:
            print(f"   ❌ Error creating 'xptransaction': {e}")

    await engine.dispose()
    print("🏁 Done.")

if __name__ == "__main__":
    asyncio.run(fix())
