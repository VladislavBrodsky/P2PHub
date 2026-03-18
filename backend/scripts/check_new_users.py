import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

async def main():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://")
        
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("\n🔍 Checking for newly created 'ghost' partners in the last 2 hours...")
        
        query = text("SELECT id, telegram_id, username, first_name, last_name, balance, created_at FROM partner ORDER BY created_at DESC LIMIT 10")
        res = await session.execute(query)
        users = res.fetchall()
        
        for u in users:
            print(f"ID: {u.id} | TG_ID: '{u.telegram_id}' | User: {u.username} | First: {u.first_name}")
            print(f"  Balance: {u.balance} | Created: {u.created_at}")
            print("-" * 40)
            
        print("\n🔍 Searching specifically for duplicates or similar TG IDs to 716720099...")
        query_likes = text("SELECT id, telegram_id, username, balance FROM partner WHERE telegram_id LIKE '%716720099%' OR username ILIKE '%uslincoln%'")
        res_likes = await session.execute(query_likes)
        for u in res_likes.fetchall():
            print(f"ID: {u.id} | TG_ID: '{u.telegram_id}' | User: {u.username} | Balance: {u.balance}")

if __name__ == "__main__":
    asyncio.run(main())
