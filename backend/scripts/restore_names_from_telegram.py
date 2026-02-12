
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

async def restore_names_from_telegram():
    """
    This function should be called from within the running application
    where BOT_TOKEN is available.
    """
    from bot import bot
    from app.core.config import settings
    from app.models.partner import async_session_maker
    
    # Check token presence
    if not settings.BOT_TOKEN or len(settings.BOT_TOKEN) < 10:
        print("❌ BOT_TOKEN is missing or too short!")
        return 0
    else:
        print(f"📡 BOT_TOKEN present (prefix: {settings.BOT_TOKEN[:10]}...)")
    
    async with async_session_maker() as session:
        print("=" * 70)
        print("🔧 RESTORING ORIGINAL DATA FROM TELEGRAM")
        print("=" * 70)
        
        from sqlalchemy import not_, String
        # Find all real users (telegram_id does not start with TEST_, SIM_, CH_, SEC_) 
        # because those cannot be checked in Telegram Bot API.
        statement = select(Partner).where(
            not_(Partner.telegram_id.cast(String).like("TEST_%")),
            not_(Partner.telegram_id.cast(String).like("SIM_%")),
            not_(Partner.telegram_id.cast(String).like("CH_%")),
            not_(Partner.telegram_id.cast(String).like("SEC_%"))
        ).order_by(Partner.xp.desc()).limit(500)
        
        result = await session.exec(statement)
        real_users = result.all()
        
        print(f"\nFound {len(real_users)} real users to check\n")
        
        restored_count = 0
        photos_fetched = 0
        failed_count = 0
        
        for user in real_users:
            try:
                # Safely convert to int for Telegram API
                try:
                    telegram_id = int(str(user.telegram_id))
                except (ValueError, TypeError):
                    # Skip non-numeric IDs (Simulated, Test, etc)
                    continue

                needs_save = False
                
                # 1. Restore Profile Data (Names/Usernames)
                try:
                    chat = await bot.get_chat(telegram_id)
                    
                    if user.first_name != chat.first_name:
                        print(f"🔄 Name {user.id}: '{user.first_name}' -> '{chat.first_name}'")
                        user.first_name = chat.first_name
                        needs_save = True
                    
                    if user.username != chat.username:
                        print(f"🔄 User {user.id}: '@{user.username}' -> '@{chat.username}'")
                        user.username = chat.username
                        needs_save = True
                except Exception as e:
                    print(f"⚠️ Chat {user.id}: {e}")
                
                # 2. Restore Photo
                if not user.photo_file_id:
                    try:
                        photos = await bot.get_user_profile_photos(telegram_id, limit=1)
                        if photos.photos:
                            photo = photos.photos[0][-1]
                            user.photo_file_id = photo.file_id
                            if user.photo_url and "/avatars/" in user.photo_url:
                                user.photo_url = None
                            print(f"🖼️ Photo {user.id}: Fetched")
                            needs_save = True
                            photos_fetched += 1
                    except Exception as e:
                        print(f"⚠️ Photo {user.id}: {e}")

                if needs_save:
                    session.add(user)
                    restored_count += 1
                    # Commit every 10 to be safe
                    if restored_count % 10 == 0:
                        await session.commit()
                    
            except Exception as e:
                print(f"❌ Error {user.id}: {e}")
                failed_count += 1
        
        await session.commit()
        
        print("\n" + "=" * 70)
        print(f"✅ Users updated: {restored_count}")
        print(f"✅ Photos fetched: {photos_fetched}")
        if failed_count > 0:
            print(f"⚠️ Failures: {failed_count}")
        print("=" * 70)
        
        return restored_count

if __name__ == "__main__":
    # This will only work when run from Railway/production environment
    asyncio.run(restore_names_from_telegram())
