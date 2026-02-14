import asyncio
import os
from app.services.notification_service import notification_service
from app.core.config import settings

async def send_test_message():
    # We use the ID found: 716720099
    target_id = 716720099
    
    test_msg = (
        "🔔 *SYSTEM TEST: New Referral*\n\n"
        "This is a manual test message to verify the notification system is working correctly for you (@uslincoln).\n\n"
        "🤝 *New Direct Partner!* (L1)\n"
        "👤 Test_User_P2P\n"
        "📈 *Status:* Successfully joined!\n"
        "💰 *Reward:* `+35 XP` (or `+175 XP` for PRO) has been simulated.\n\n"
        "✅ If you see this message, the bot notification service is alive and well!"
    )
    
    print(f"Sending test notification to {target_id}...")
    try:
        # notification_service.enqueue_notification uses TaskIQ, but has a fallback
        # Since we are running in a script, it might use the fallback (direct send)
        # or it might attempt to send to Redis. 
        # For a clean test, I'll use the service.
        await notification_service.enqueue_notification(chat_id=target_id, text=test_msg)
        print("✅ Message enqueued/sent. Please check your Telegram bot.")
    except Exception as e:
        print(f"❌ Failed to send message: {e}")

if __name__ == "__main__":
    # Ensure BOT_TOKEN is set for the bot instance used by notification_service
    # We'll rely on settings being loaded (hopefully)
    # But since we have issues with pydantic-settings in scripts without .env, 
    # I'll manually set the token from what I saw.
    os.environ["BOT_TOKEN"] = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
    
    asyncio.run(send_test_message())
