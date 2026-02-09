import asyncio
import logging
from bot import bot
# Remove redis dependency for notifications
# from app.services.redis_service import redis_service 

logger = logging.getLogger(__name__)

class NotificationService:
    async def enqueue_notification(self, chat_id: int, text: str, parse_mode: str = "Markdown", retry_count: int = 0):
        """
        Sends a notification directly via the Bot API.
        This runs inside the background task (process_referral_logic), so it's safe to await.
        """
        try:
            # Direct send
            await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
        except Exception as e:
            logger.error(f"Failed to send notification to {chat_id}: {e}")
            # Simple retry logic for network blips
            if retry_count < 3:
                try:
                    await asyncio.sleep(1 * (retry_count + 1))
                    await self.enqueue_notification(chat_id, text, parse_mode, retry_count + 1)
                except Exception as retry_err:
                     logger.error(f"Retry failed for {chat_id}: {retry_err}")

    # Worker is no longer needed
    async def process_notifications_worker(self):
        pass

notification_service = NotificationService()
