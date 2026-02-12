
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
        print("🔍 SEARCHING FOR SPECIFIC USERS")
        print("=" * 70)
        
        # Search patterns for the mentioned users
        search_patterns = [
            "kovshov", "mr_kovshov", "rudskixx", "dmitry",
            "anngrand", "ann", "dimitri", "fuerte"
        ]
        
        # Get all users and search broadly
        statement = select(Partner).limit(200)
        result = await session.exec(statement)
        all_users = result.all()
        
        found_users = []
        
        for user in all_users:
            username_lower = (user.username or "").lower()
            name_lower = (user.first_name or "").lower() + " " + (user.last_name or "").lower()
            
            for pattern in search_patterns:
                if pattern in username_lower or pattern in name_lower:
                    found_users.append(user)
                    break
        
        if not found_users:
            print("\n❌ None of the specified users found in database")
            print("\nTrying broader search for recently active users...")
            
            # Search for users with photo_file_id (real users)
            statement = select(Partner).where(
                Partner.photo_file_id.isnot(None)
            ).order_by(Partner.created_at.desc()).limit(30)
            result = await session.exec(statement)
            recent_users = result.all()
            
            print(f"\nShowing {len(recent_users)} most recent real users:")
            for user in recent_users:
                print(f"\nTelegram ID: {user.telegram_id}")
                print(f"  Name: {user.first_name} {user.last_name or ''}")
                print(f"  Username: @{user.username}")
                print(f"  Created: {user.created_at}")
                print(f"  XP: {user.xp}")
        else:
            print(f"\n✅ Found {len(found_users)} matching users:\n")
            
            for user in found_users:
                print(f"User ID: {user.id} | Telegram ID: {user.telegram_id}")
                print(f"  Name: {user.first_name} {user.last_name or ''}")
                print(f"  Username: @{user.username}")
                print(f"  XP: {user.xp}")
                print(f"  Photo URL: {user.photo_url}")
                print(f"  Photo File ID: {'Yes' if user.photo_file_id else 'No'}")
                print(f"  Created: {user.created_at}")
                print()

if __name__ == "__main__":
    asyncio.run(main())
