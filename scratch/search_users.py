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

async def search_db():
    async with async_session_maker() as session:
        # Search for username
        stmt = select(Partner).where(Partner.username.ilike("%uslincoln%"))
        res = await session.exec(stmt)
        users_by_username = res.all()
        
        print(f"--- Users with username matching 'uslincoln' ({len(users_by_username)}): ---")
        for u in users_by_username:
            print(f"ID={u.id}, TG={u.telegram_id}, Username={u.username}, IsPro={u.is_pro}, Plan={u.subscription_plan}")
            
        # Search for telegram id
        stmt = select(Partner).where(Partner.telegram_id == "716720099")
        res = await session.exec(stmt)
        users_by_tg = res.all()
        
        print(f"\n--- Users with Telegram ID '716720099' ({len(users_by_tg)}): ---")
        for u in users_by_tg:
            print(f"ID={u.id}, TG={u.telegram_id}, Username={u.username}, IsPro={u.is_pro}, Plan={u.subscription_plan}")

if __name__ == "__main__":
    asyncio.run(search_db())
