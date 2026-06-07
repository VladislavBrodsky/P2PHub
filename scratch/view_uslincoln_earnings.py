import asyncio
import os
import sys
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.models.partner import Partner, Earning

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def view_earnings():
    async with async_session_maker() as session:
        stmt_user = select(Partner).where(Partner.username.ilike("uslincoln"))
        res_user = await session.exec(stmt_user)
        user = res_user.first()
        if not user:
            print("❌ User not found")
            return
            
        print(f"Partner: @{user.username} (ID: {user.id})")
        
        # Query only USDT and TON earnings
        stmt_earnings = select(Earning).where(Earning.partner_id == user.id, Earning.currency != "XP").order_by(Earning.created_at.desc())
        res_earnings = await session.exec(stmt_earnings)
        earnings = res_earnings.all()
        
        print(f"\n--- Total USDT/TON Earning records: {len(earnings)} ---")
        for e in earnings:
            print(f"ID: {e.id}, Amount: {e.amount}, Currency: {e.currency}, Type: {e.type}, Created At: {e.created_at} ({type(e.created_at).__name__}), Description: {e.description}")

if __name__ == "__main__":
    asyncio.run(view_earnings())
