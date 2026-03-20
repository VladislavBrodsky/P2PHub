
import asyncio
from sqlmodel import select, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
import json
import os
import sys

# Production DB from .env
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def view_partners():
    from app.models.partner import Partner
    from sqlalchemy import text
    async with async_session_maker() as session:
        # Search for XP around 10795
        stmt = select(Partner).where(Partner.xp >= 10790, Partner.xp <= 10800)
        result = await session.exec(stmt)
        partners = result.all()
        if not partners:
            print("No partners found in range 10790-10800 XP.")
        for p in partners:
            print(f"ID: {p.id}, TG: {p.telegram_id}, Username: {p.username}, XP: {p.xp}, Level: {p.level}, Pro: {p.is_pro}")

if __name__ == "__main__":
    # Add backend to path to import models
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_path = os.path.join(current_dir, "backend")
    if os.path.exists(backend_path):
        sys.path.append(backend_path)
    asyncio.run(view_partners())
