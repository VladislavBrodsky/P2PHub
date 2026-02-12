
import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.partner import Partner

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL is not set!")
        return
        
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("=" * 70)
        print("🔍 CHECKING PHOTO STATUS FOR TOP USERS")
        print("=" * 70)
        
        # Get top 10 users
        statement = select(Partner).order_by(Partner.xp.desc()).limit(10)
        result = await session.exec(statement)
        users = result.all()
        
        print(f"\nTop 10 users photo status:\n")
        
        for i, user in enumerate(users, 1):
            print(f"Rank #{i} - {user.first_name} (@{user.username})")
            print(f"  Telegram ID: {user.telegram_id}")
            print(f"  photo_url: {user.photo_url}")
            print(f"  photo_file_id: {user.photo_file_id[:30] if user.photo_file_id else 'MISSING ❌'}")
            print()

if __name__ == "__main__":
    asyncio.run(main())
