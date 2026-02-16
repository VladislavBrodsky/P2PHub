
import asyncio
from sqlmodel import select, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
import json
import os

# Production DB from .env
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def view_partners():
    from app.models.partner import Partner
    async with async_session_maker() as session:
        stmt = select(Partner).order_by(Partner.created_at.desc()).limit(10)
        result = await session.exec(stmt)
        partners = result.all()
        for p in partners:
            print(f"ID: {p.id}, TG: {p.telegram_id}, Username: {p.username}, Pro: {p.is_pro}, Created: {p.created_at}")

if __name__ == "__main__":
    import sys
    # Add backend to path to import models
    sys.path.append("/Users/grandmaestro/Documents/P2PHub/backend")
    asyncio.run(view_partners())
