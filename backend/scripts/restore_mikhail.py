
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
        print("🔍 FINDING RANK 2 USER (550 XP)")
        print("=" * 70)
        
        # Find user with 550 XP (should be Mikhail Kovshov)
        statement = select(Partner).where(
            Partner.xp >= 549, Partner.xp <= 551
        ).order_by(Partner.xp.desc())
        
        result = await session.exec(statement)
        users = result.all()
        
        if not users:
            print("❌ No user found with ~550 XP")
            # Try top users
            statement = select(Partner).order_by(Partner.xp.desc()).limit(10)
            result = await session.exec(statement)
            users = result.all()
            print(f"\nTop 10 users by XP:")
            for i, u in enumerate(users, 1):
                print(f"{i}. {u.first_name} (@{u.username}) - {u.xp} XP - Telegram ID: {u.telegram_id}")
            return
        
        print(f"\nFound {len(users)} user(s) with ~550 XP:\n")
        
        for user in users:
            print(f"User ID: {user.id}")
            print(f"  Telegram ID: {user.telegram_id}")
            print(f"  Current Name: {user.first_name} {user.last_name or ''}")
            print(f"  Current Username: @{user.username}")
            print(f"  XP: {user.xp}")
            print(f"  Photo URL: {user.photo_url}")
            print(f"  Photo File ID: {'Yes' if user.photo_file_id else 'No'}")
            
            # If this looks like a corrupted user, restore to Mikhail Kovshov
            if user.first_name and ("vitalik" in user.first_name.lower() or 
                                    "fan" in user.first_name.lower() or
                                    user.photo_url and "/avatars/" in user.photo_url):
                print("\n  🔧 This appears to be corrupted. Restoring to Mikhail Kovshov...")
                user.first_name = "Mikhail Kovshov"
                user.last_name = None
                user.username = "mr_kovshov1"
                
                # Clear fake avatar
                if user.photo_url and "/avatars/" in user.photo_url:
                    print(f"  🔄 Clearing fake avatar: {user.photo_url}")
                    user.photo_url = None
                
                session.add(user)
                await session.commit()
                print("  ✅ Restored to: Mikhail Kovshov @mr_kovshov1")

if __name__ == "__main__":
    asyncio.run(main())
