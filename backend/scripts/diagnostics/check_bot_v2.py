import asyncio
import logging
import os
import sys
from pathlib import Path

# Add project root to sys.path
root = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(root))
sys.path.append(str(root / "backend"))

# Manual .env loading
def load_env(path):
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

async def check_webhook():
    # Try multiple .env locations
    load_env(root / "frontend" / ".env")
    load_env(root / "backend" / ".env")
    load_env(root / ".env")

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        from backend.app.core.config import Settings
        from backend.bot import bot
        
        # Instantiate settings again after loading .env
        settings = Settings()
        
        logger.info("Checking Webhook Info...")
        webhook_info = await bot.get_webhook_info()
        logger.info(f"Telegram Side - Webhook URL: {webhook_info.url or 'NONE (Polling Mode)'}")
        logger.info(f"Telegram Side - Pending Updates: {webhook_info.pending_update_count}")
        
        logger.info("-" * 20)
        logger.info(f"Local Settings - WEBHOOK_URL: {settings.WEBHOOK_URL}")
        logger.info(f"Local Settings - WEBHOOK_PATH: {settings.WEBHOOK_PATH}")
        
        await bot.session.close()
    except Exception as e:
        logger.error(f"Error checking webhook: {e}")

if __name__ == "__main__":
    asyncio.run(check_webhook())
