import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.models.partner import Partner
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_user():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username.ilike("uslincoln"))
        res = await session.exec(stmt)
        user = res.first()
        
        if not user:
            print("❌ User @uslincoln not found in database!")
            return
            
        print(f"✅ User found: @{user.username}")
        print(f"ID: {user.id}")
        print(f"Telegram ID: {user.telegram_id}")
        print(f"Is Pro: {user.is_pro}")
        print(f"Subscription Plan: {user.subscription_plan}")
        print(f"Pro Tokens: {user.pro_tokens}")
        print(f"Is Pro Plus (Property): {user.is_pro_plus}")
        print(f"Completed Stages: {user.completed_stages}")
        print(f"Unlocked Stages: {user.unlocked_stages}")

if __name__ == "__main__":
    asyncio.run(check_user())
