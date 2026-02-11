
import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def grant_proof_xp():
    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=False, future=True)

    async with engine.begin() as conn:
        print("🚀 Granting Proof of Work XP to @uslincoln (ID: 1)...")

        # 1. Increment XP in Partner table
        await conn.execute(text("UPDATE partner SET xp = xp + 1 WHERE id = 1"))

        # 2. Add XPTransaction
        await conn.execute(text("""
            INSERT INTO xptransaction (partner_id, amount, type, description, created_at)
            VALUES (1, 1, 'SYSTEM_MSG', 'Verification: 9-Level Logic Deployed ✅', NOW())
        """))

        # 3. Add Earning
        await conn.execute(text("""
            INSERT INTO earning (partner_id, amount, description, type, level, currency, created_at)
            VALUES (1, 1, 'Verification: 9-Level Logic Deployed ✅', 'REFERRAL_XP', 1, 'XP', NOW())
        """))

        print("✅ Success! @uslincoln now has +1 more XP and a history record.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(grant_proof_xp())
