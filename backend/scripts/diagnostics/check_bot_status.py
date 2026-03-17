import asyncio
import logging
import os
import sys

# Set up logging to stderr for immediate visibility
logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger(__name__)

# Add the project root to sys.path
sys.path.append(os.getcwd() + "/backend")

async def check_webhook():
    try:
        from backend.app.core.config import settings
        from backend.bot import bot
        
        logger.info("Checking Webhook Info...")
        webhook_info = await bot.get_webhook_info()
        logger.info(f"Webhook URL: {webhook_info.url}")
        logger.info(f"Has Custom Certificate: {webhook_info.has_custom_certificate}")
        logger.info(f"Pending Update Count: {webhook_info.pending_update_count}")
        logger.info(f"Last Error Date: {webhook_info.last_error_date}")
        logger.info(f"Last Error Message: {webhook_info.last_error_message}")
        logger.info(f"Max Connections: {webhook_info.max_connections}")
        logger.info(f"Allowed Updates: {webhook_info.allowed_updates}")
        
        logger.info("-" * 20)
        logger.info(f"Configured WEBHOOK_URL in settings: {settings.WEBHOOK_URL}")
        logger.info(f"Configured WEBHOOK_PATH in settings: {settings.WEBHOOK_PATH}")
        logger.info(f"Configured WEBHOOK_SECRET is set: {bool(settings.WEBHOOK_SECRET)}")
        
        await bot.session.close()
    except Exception as e:
        logger.error(f"Error checking webhook: {e}")

if __name__ == "__main__":
    asyncio.run(check_webhook())
