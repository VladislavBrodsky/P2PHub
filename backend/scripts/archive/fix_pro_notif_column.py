import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def fix_schema():
    # Force use of production URL for emergency fix
    # This URL was retrieved from existing maintenance scripts in the repo
    db_url = os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY")

    print(f"🚀 Connecting to production DB: {db_url.split('@')[-1]}")
    engine = create_async_engine(db_url, echo=True, future=True)

    async with engine.begin() as conn:
        print("🛠 Checking for missing columns in 'partner' table...")

        # 1. Add pro_notification_seen
        try:
            await conn.execute(text("ALTER TABLE partner ADD COLUMN IF NOT EXISTS pro_notification_seen BOOLEAN DEFAULT FALSE"))
            print("   ✅ 'pro_notification_seen' added or already exists.")
        except Exception as e:
            print(f"   ❌ Error adding 'pro_notification_seen': {e}")

        # 2. Ensure total_earned_usdt exists
        try:
            await conn.execute(text("ALTER TABLE partner ADD COLUMN IF NOT EXISTS total_earned_usdt FLOAT DEFAULT 0.0"))
            print("   ✅ 'total_earned_usdt' ensured.")
        except Exception as e:
            print(f"   ❌ Error adding 'total_earned_usdt': {e}")

        # 3. Ensure referral_count exists
        try:
            await conn.execute(text("ALTER TABLE partner ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0"))
            print("   ✅ 'referral_count' ensured.")
        except Exception as e:
            print(f"   ❌ Error adding 'referral_count': {e}")

    await engine.dispose()
    print("🏁 Schema sync completed.")

if __name__ == "__main__":
    asyncio.run(fix_schema())
