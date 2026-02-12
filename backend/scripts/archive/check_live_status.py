
import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY")

async def check_live_status():
    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=False, future=True)

    async with engine.connect() as conn:
        print("🔍 Checking LIVE status for @uslincoln (ID: 1)...")

        # Check XP transactions in the last 15 minutes
        res = await conn.execute(text("SELECT type, amount, description, created_at FROM xptransaction WHERE partner_id = 1 AND created_at > NOW() - INTERVAL '15 minutes' ORDER BY created_at DESC"))
        rows = res.all()
        if rows:
            print(f"✅ Found {len(rows)} RECENT XP transactions:")
            for r in rows:
                print(f"   [{r[3]}] {r[0]}: {r[1]} XP - {r[2]}")
        else:
            print("❌ No recent XP transactions found for ID 1.")

        # Check Earnings in the last 15 minutes
        res = await conn.execute(text("SELECT type, amount, description, created_at FROM earning WHERE partner_id = 1 AND created_at > NOW() - INTERVAL '15 minutes' ORDER BY created_at DESC"))
        rows = res.all()
        if rows:
            print(f"✅ Found {len(rows)} RECENT earnings:")
            for r in rows:
                print(f"   [{r[3]}] {r[0]}: {r[1]} - {r[2]}")
        else:
            print("❌ No recent earnings found for ID 1.")

        # Check the newly created user (sim_user_X or whoever joined)
        res = await conn.execute(text("SELECT id, username, telegram_id, created_at FROM partner ORDER BY created_at DESC LIMIT 5"))
        print("\n🆕 Latest 5 Partners joined:")
        for r in res:
             print(f"   ID: {r[0]}, Username: {r[1]}, TG: {r[2]}, Joined: {r[3]}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_live_status())
