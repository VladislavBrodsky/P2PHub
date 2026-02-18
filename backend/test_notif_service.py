
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
def mock_load_dotenv(*args, **kwargs):
    return True
import dotenv
dotenv.load_dotenv = mock_load_dotenv

async def test_notif():
    print("Testing notification service...")
    from app.services.notification_service import notification_service
    
    # Use the test user ID from the logs: 537873096
    test_chat_id = 537873096
    
    print(f"Enqueuing test notification for {test_chat_id}...")
    try:
        await notification_service.enqueue_notification(
            chat_id=test_chat_id,
            text="🔔 *SYSTEM TEST*\n\nYour notification system sanity check is active. If you see this, notifications are working!",
            parse_mode="Markdown"
        )
        print("✅ Enqueue call completed (check logs for actual delivery).")
    except Exception as e:
        print(f"❌ Enqueue call failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_notif())
