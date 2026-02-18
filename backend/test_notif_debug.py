
import asyncio
import os
import sys

# Hardcoding environment variables due to permission issues with .env files
os.environ["BOT_TOKEN"] = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
os.environ["REDIS_URL"] = "redis://:HXYVAM4yGCiqfe23433445sdf34serwer3242144tX345o23HCOCbAIpqYNJKLAvMt423553454@redis.railway.internal:6379/0"

# Add backend directory to sys.path so 'app' can be found
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Monkeypatch load_dotenv
import dotenv
dotenv.load_dotenv = lambda *args, **kwargs: True

import logging
logging.basicConfig(level=logging.INFO)

async def test_notif():
    print("Testing notification service with manual audit log check...")
    from app.services.notification_service import notification_service
    from app.models.partner import engine
    from sqlmodel.ext.asyncio.session import AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    test_chat_id = 537873096
    
    print(f"Directly testing bot.getMe to verify token...")
    from bot import bot
    me = await bot.get_me()
    print(f"Bot info: {me.username}")

    print(f"Enqueuing test notification for {test_chat_id}...")
    try:
        await notification_service.enqueue_notification(
            chat_id=test_chat_id,
            text="🔔 *SYSTEM TEST* - Enqueued at " + str(datetime.now()),
            parse_mode="Markdown"
        )
        print("✅ Enqueue call completed.")
    except Exception as e:
        print(f"❌ Enqueue call encountered exception: {e}")

if __name__ == "__main__":
    from datetime import datetime
    asyncio.run(test_notif())
