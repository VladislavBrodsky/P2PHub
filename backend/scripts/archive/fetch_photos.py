
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

async def fetch_photos_from_telegram():
    """
    Fetch profile photos from Telegram for users who are missing photo_file_id.
    This function requires BOT_TOKEN to be available.
    """
    from bot import bot
    from app.models.partner import async_session_maker
    
    async with async_session_maker() as session:
        print("=" * 70)
        print("🖼️  FETCHING MISSING PROFILE PHOTOS FROM TELEGRAM")
        print("=" * 70)
        
        # Find users without photo_file_id but with real telegram_id
        statement = select(Partner).where(
            Partner.photo_file_id.is_(None)
        ).limit(100)
        
        result = await session.exec(statement)
        users = result.all()
        
        # Filter out test users
        real_users = [u for u in users if not str(u.telegram_id).startswith("TEST_")]
        
        print(f"\nFound {len(real_users)} real users without photo_file_id\n")
        
        fetched_count = 0
        failed_count = 0
        
        for user in real_users:
            try:
                telegram_id = int(user.telegram_id)
                
                # Get user profile photos
                photos = await bot.get_user_profile_photos(telegram_id, limit=1)
                
                if photos.photos and len(photos.photos) > 0:
                    # Get the highest resolution photo
                    photo = photos.photos[0][-1]  # Last item is highest res
                    file_id = photo.file_id
                    
                    print(f"✅ {user.first_name} (@{user.username})")
                    print(f"   Photo file_id: {file_id[:30]}...")
                    
                    user.photo_file_id = file_id
                    # Clear photo_url to let frontend use file_id
                    if user.photo_url and "/avatars/" in user.photo_url:
                        user.photo_url = None
                    
                    session.add(user)
                    fetched_count += 1
                else:
                    print(f"⚠️  {user.first_name} (@{user.username}): No profile photo found")
                    failed_count += 1
                    
            except Exception as e:
                print(f"❌ {user.first_name} (@{user.username}): {e}")
                failed_count += 1
        
        await session.commit()
        
        print("\n" + "=" * 70)
        print(f"✅ Fetched {fetched_count} photos")
        if failed_count > 0:
            print(f"⚠️  {failed_count} users had no photos or errors")
        print("=" * 70)
        
        return fetched_count

if __name__ == "__main__":
    asyncio.run(fetch_photos_from_telegram())
