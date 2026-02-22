import asyncio
import logging
import sys
import os
from pathlib import Path

# Add project root to sys.path
root = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root))
sys.path.append(str(root / "backend"))

async def force_set_webhook():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    # Values from user's Railway configuration
    WEBHOOK_URL = "https://p2phub-production.up.railway.app/api/bot/webhook"
    WEBHOOK_SECRET = "P2PHubSecret2026SecureToken"
    
    try:
        from backend.bot import bot
        from backend.app.core.config import settings
        
        logger.info(f"Setting Webhook to: {WEBHOOK_URL}")
        
        # We drop pending updates to start fresh and avoid processing old polling-era messages
        success = await bot.set_webhook(
            url=WEBHOOK_URL,
            secret_token=WEBHOOK_SECRET,
            drop_pending_updates=True,
            allowed_updates=["message", "callback_query", "inline_query", "channel_post", "edited_channel_post"]
        )
        
        if success:
            logger.info("✅ Webhook successfully registered with Telegram!")
            info = await bot.get_webhook_info()
            logger.info(f"Verified URL: {info.url}")
        else:
            logger.error("❌ Telegram rejected the webhook registration.")
            
        await bot.session.close()
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(force_set_webhook())
