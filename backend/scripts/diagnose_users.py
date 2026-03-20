import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine

async def check_recent():
    async with AsyncSession(engine) as session:
        statement = select(Partner).order_by(Partner.created_at.desc()).limit(10)
        result = await session.exec(statement)
        partners = result.all()
        
        print("\n--- RECENT USERS ---")
        for p in partners:
            print(f"ID: {p.id} | TG: {p.telegram_id} | User: {p.username} | Created: {p.created_at} | Path: {p.path} | Test: {p.is_test} | XP: {p.xp} | Level: {p.level}")
        print("--------------------\n")

if __name__ == "__main__":
    asyncio.run(check_recent())
