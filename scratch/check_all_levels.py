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

async def check_levels():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.level == 42)
        res = await session.exec(stmt)
        users = res.all()
        
        print(f"--- Users with Level 42 ({len(users)}): ---")
        for u in users:
            print(f"ID={u.id}, TG={u.telegram_id}, Username={u.username}, Level={u.level}, XP={u.xp}, IsPro={u.is_pro}, Plan={u.subscription_plan}")

        stmt = select(Partner).where(Partner.xp >= 80000)
        res = await session.exec(stmt)
        users_xp = res.all()
        
        print(f"\n--- Users with XP >= 80000 ({len(users_xp)}): ---")
        for u in users_xp:
            print(f"ID={u.id}, TG={u.telegram_id}, Username={u.username}, Level={u.level}, XP={u.xp}, IsPro={u.is_pro}, Plan={u.subscription_plan}")

if __name__ == "__main__":
    asyncio.run(check_levels())
