
import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.partner import Partner, get_session
from app.core.config import settings
from sqlmodel import select, create_engine
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

# Fix for Railway providing postgresql:// but SQLAlchemy requiring postgresql+asyncpg://
database_url = settings.DATABASE_URL
if database_url and database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(database_url, echo=False, future=True)

async def main():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        statement = select(Partner).order_by(Partner.created_at.desc()).limit(10)
        result = await session.exec(statement)
        partners = result.all()
        
        print(f"Found {len(partners)} recent partners:")
        for p in partners:
            print(f"ID: {p.id}, Name: {p.first_name} {p.last_name}, Username: {p.username}, PhotoURL: {p.photo_url}")
            
if __name__ == "__main__":
    asyncio.run(main())
