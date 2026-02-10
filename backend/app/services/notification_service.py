import asyncio
import logging
# from bot import bot (Moved inside functions to break circular dependency)
from app.worker import broker

logger = logging.getLogger(__name__)

@broker.task
async def send_telegram_task(chat_id: int, text: str, parse_mode: str = "Markdown"):
    """
    Background worker task to send Telegram messages.
    """
    try:
        from bot import bot
        await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
        return True
    except Exception as e:
        logger.error(f"Worker failed to send notification to {chat_id}: {e}")
        return False

class NotificationService:
    async def enqueue_notification(self, chat_id: int, text: str, parse_mode: str = "Markdown"):
        """
        Enqueues a notification to be sent by the background worker.
        """
        try:
            # Send to TaskIQ broker
            await send_telegram_task.kiq(chat_id, text, parse_mode)
        except Exception as e:
            logger.error(f"Failed to enqueue notification for {chat_id}: {e}")
            # Fallback to direct send if broker fails
            from bot import bot
            asyncio.create_task(bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode))

    async def process_notifications_worker(self):
        """Deprecated: superseded by TaskIQ worker."""
        pass

notification_service = NotificationService()
