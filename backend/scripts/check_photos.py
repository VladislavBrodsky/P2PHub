
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import Partner

# Hardcoded for debugging
database_url = os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY")

engine = create_async_engine(database_url, echo=False, future=True)

print(f"DEBUG: database_url from settings: {settings.DATABASE_URL}")
print(f"DEBUG: database_url used for engine: {database_url}")
import os

print(f"DEBUG: os.environ DATABASE_URL: {os.environ.get('DATABASE_URL')}")

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
