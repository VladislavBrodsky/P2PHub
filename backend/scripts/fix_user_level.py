import asyncio
import os
import sys

# --- PRE-IMPORT CONFIGURATION ---
# Credentials removed for security. Use environment variables.
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("❌ DATABASE_URL environment variable is not set!")
    sys.exit(1)

# Ensure BOT_TOKEN is set
if not os.getenv("BOT_TOKEN"):
    print("⚠️ BOT_TOKEN not set, using dummy for script bypass...")
    os.environ["BOT_TOKEN"] = "dummy_token"
os.environ["REDIS_URL"] = "redis://localhost:6379/0" # Dummy
os.environ["FRONTEND_URL"] = "http://localhost:3000" # Dummy

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner


async def main():
    print("Using Database from environment...")

    engine = create_async_engine(DB_URL, echo=False, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    referral_code = "P716720099" # User's referral code

    async with async_session() as session:
        # Find User
        statement = select(Partner).where(Partner.referral_code == referral_code)
        result = await session.exec(statement)
        partner = result.first()

        if not partner:
            print(f"❌ User with code {referral_code} not found!")
            return

        print(f"Found Partner: {partner.first_name} (ID: {partner.id})")
        print(f"Current State: Level {partner.level}, XP {partner.xp}")

        # Recalculate Level
        # Formula: Next Level Threshold = Current Level * 100
        # If XP is 140, Level 1 -> Threshold 100. 140 >= 100 -> Level 2.
        # Level 2 -> Threshold 200. 140 < 200 -> Stop.

        updates_made = False
        while partner.xp >= partner.level * 100:
            partner.level += 1
            updates_made = True
            print(f"🚀 Upgrading to Level {partner.level}...")

        if updates_made:
            session.add(partner)
            await session.commit()
            await session.refresh(partner)
            print(f"✅ User updated: Level {partner.level}, XP {partner.xp}")
        else:
            print("✅ User is already at correct level.")

if __name__ == "__main__":
    asyncio.run(main())
