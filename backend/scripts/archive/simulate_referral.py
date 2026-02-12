import asyncio
import os
import sys

# --- PRE-IMPORT CONFIGURATION ---
# Set env vars BEFORE importing app modules to satisfy Pydantic
PUBLIC_DB_URL = os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY")
FAKE_BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

# Use real token if passed from shell, otherwise fake
token_from_env = os.getenv("BOT_TOKEN")
if not token_from_env:
    os.environ["BOT_TOKEN"] = FAKE_BOT_TOKEN
else:
    # Ensure it's set for Pydantic if not already (it is, but good to be safe)
    os.environ["BOT_TOKEN"] = token_from_env

os.environ["DATABASE_URL"] = PUBLIC_DB_URL
os.environ["REDIS_URL"] = "redis://localhost:6379/0" # Dummy
os.environ["FRONTEND_URL"] = "http://localhost:3000" # Dummy

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Real Bot for testing
from aiogram import Bot
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner
from app.services.partner_service import create_partner
from app.services.referral_service import process_referral_notifications

# Use the token from env (which we set in the script)
real_bot = Bot(token=os.environ["BOT_TOKEN"])

async def main():
    print(f"Using DB: {PUBLIC_DB_URL}")
    print(f"Using Bot Token: {os.environ['BOT_TOKEN'][:5]}...")

    # Create engine manually to be sure (though config should load it now)
    engine = create_async_engine(PUBLIC_DB_URL, echo=False, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    referrer_code = "P716720099"
    # Generate a NEW random test user ID each time to ensure "start" logic triggers
    import random
    test_telegram_id = str(random.randint(100000000, 999999999))
    test_username = f"new_partner_{test_telegram_id[:4]}"

    print("--- Simulating Referral ---")
    print(f"Referrer Code: {referrer_code}")
    print(f"New User ID: {test_telegram_id}")

    async with async_session() as session:
        # 1. Check Referrer Initial State
        statement = select(Partner).where(Partner.referral_code == referrer_code)
        result = await session.exec(statement)
        referrer = result.first()

        if not referrer:
            print("❌ Referrer not found!")
            await real_bot.session.close()
            return

        initial_xp = referrer.xp
        print(f"Referrer Initial XP: {initial_xp}")

        # 3. Create Partner
        print("Creating new partner...")
        new_partner, is_new = await create_partner(
            session=session,
            telegram_id=test_telegram_id,
            username=test_username,
            first_name="Test",
            last_name="Partner",
            language_code="en",
            referrer_code=referrer_code
        )

        if is_new:
            print("✅ New partner created successfully.")

            # 4. Process Notifications (REAL)
            print("Processing notifications (SENDING REAL TELEGRAM MESSAGE)...")
            await process_referral_notifications(real_bot, session, new_partner, is_new)

            # 5. Verify XP
            await session.refresh(referrer)
            final_xp = referrer.xp
            print(f"Referrer Final XP: {final_xp}")

            if final_xp >= initial_xp + 35:
                print("✅ XP added correctly (+35)")
            else:
                print("❌ XP check failed.")
        else:
            print("⚠️ Partner was not new.")

    await real_bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
