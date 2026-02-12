
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
        # Search for users that might be Grand Maestro
        # They were overwritten with "Satoshi_Nakamoto" based on the screenshot
        statement = select(Partner).where(
            (Partner.first_name.like("%Satoshi%")) |
            (Partner.username.like("%satoshi%")) |
            (Partner.username.like("%lincoln%"))
        ).order_by(Partner.xp.desc()).limit(10)
        
        result = await session.exec(statement)
        users = result.all()
        
        if not users:
            print("❌ No matching users found!")
            return
        
        print(f"Found {len(users)} potential matches:")
        for i, user in enumerate(users, 1):
            print(f"\n{i}. ID: {user.id}")
            print(f"   Telegram ID: {user.telegram_id}")
            print(f"   First Name: {user.first_name}")
            print(f"   Username: {user.username}")
            print(f"   XP: {user.xp}")
            print(f"   Photo URL: {user.photo_url}")
            print(f"   Photo File ID: {user.photo_file_id}")
        
        # Assuming the top XP user with Satoshi name is Grand Maestro
        if users:
            print("\n" + "="*50)
            print("Restoring first match (highest XP)...")
            user = users[0]
            
            user.first_name = "Grand Maestro"
            user.last_name = None
            user.username = "uslincoln"
            
            # Clear fake avatar
            if user.photo_url and "/avatars/" in user.photo_url:
                print(f"🔄 Clearing fake avatar: {user.photo_url}")
                user.photo_url = None
            
            session.add(user)
            await session.commit()
            
            print("✅ Successfully restored Grand Maestro's profile!")
            print(f"   Telegram ID: {user.telegram_id}")
            print(f"   First Name: {user.first_name}")
            print(f"   Username: @{user.username}")

if __name__ == "__main__":
    asyncio.run(main())
