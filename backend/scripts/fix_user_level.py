import asyncio
import logging
import sys
import os

# --- PRE-IMPORT CONFIGURATION ---
PUBLIC_DB_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
FAKE_BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

# Use real token if passed from shell, otherwise fake
token_from_env = os.getenv("BOT_TOKEN")
if not token_from_env:
    os.environ["BOT_TOKEN"] = FAKE_BOT_TOKEN
else:
    os.environ["BOT_TOKEN"] = token_from_env

os.environ["DATABASE_URL"] = PUBLIC_DB_URL
os.environ["REDIS_URL"] = "redis://localhost:6379/0" # Dummy
os.environ["FRONTEND_URL"] = "http://localhost:3000" # Dummy

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import Partner
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def main():
    print(f"Using DB: {PUBLIC_DB_URL}")
    
    engine = create_async_engine(PUBLIC_DB_URL, echo=False, future=True)
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
