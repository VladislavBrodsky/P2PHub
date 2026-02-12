
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
    from app.models.partner import async_session_maker
    
    async with async_session_maker() as session:
        print("=" * 70)
        print("🔧 RESTORING ORIGINAL NAMES FROM TELEGRAM")
        print("=" * 70)
        
        # Find all real users (with photo_file_id)
        statement = select(Partner).where(
            Partner.photo_file_id.isnot(None)
        ).limit(100)
        
        result = await session.exec(statement)
        real_users = result.all()
        
        print(f"\nFound {len(real_users)} real users to check\n")
        
        restored_count = 0
        failed_count = 0
        
        for user in real_users:
            try:
                # Skip if telegram_id looks like a test ID
                if "TEST_" in str(user.telegram_id):
                    continue
                
                telegram_id = int(user.telegram_id)
                
                # Fetch current profile from Telegram
                try:
                    chat = await bot.get_chat(telegram_id)
                    
                    original_first_name = chat.first_name
                    original_last_name = chat.last_name
                    original_username = chat.username
                    
                    # Check if current data differs from Telegram
                    needs_update = False
                    
                    if user.first_name != original_first_name:
                        print(f"\n🔄 User {user.id} ({telegram_id})")
                        print(f"   Name: '{user.first_name}' → '{original_first_name}'")
                        user.first_name = original_first_name
                        needs_update = True
                    
                    if user.last_name != original_last_name:
                        if not needs_update:
                            print(f"\n🔄 User {user.id} ({telegram_id})")
                        print(f"   Last Name: '{user.last_name}' → '{original_last_name}'")
                        user.last_name = original_last_name
                        needs_update = True
                    
                    if user.username != original_username:
                        if not needs_update:
                            print(f"\n🔄 User {user.id} ({telegram_id})")
                        print(f"   Username: '@{user.username}' → '@{original_username}'")
                        user.username = original_username
                        needs_update = True
                    
                    if needs_update:
                        session.add(user)
                        restored_count += 1
                        print(f"   ✅ Restored from Telegram")
                    
                except Exception as e:
                    if "chat not found" not in str(e).lower():
                        print(f"\n⚠️  User {user.id} ({telegram_id}): Could not fetch from Telegram - {e}")
                    failed_count += 1
                    
            except Exception as e:
                print(f"\n❌ Error processing user {user.id}: {e}")
                failed_count += 1
        
        await session.commit()
        
        print("\n" + "=" * 70)
        print(f"✅ Restored {restored_count} users from Telegram")
        if failed_count > 0:
            print(f"⚠️  {failed_count} users could not be fetched (may be deleted/blocked)")
        print("=" * 70)
        
        return restored_count

if __name__ == "__main__":
    # This will only work when run from Railway/production environment
    asyncio.run(restore_names_from_telegram())
