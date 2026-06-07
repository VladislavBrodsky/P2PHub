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

async def check_stats():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username.ilike("uslincoln"))
        res = await session.exec(stmt)
        user = res.first()
        
        if not user:
            print("❌ User not found!")
            return
            
        print(f"Username: {user.username}")
        print(f"Level in DB: {user.level}")
        print(f"XP in DB: {user.xp}")

if __name__ == "__main__":
    asyncio.run(check_stats())
