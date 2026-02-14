import asyncio
import logging

# from bot import bot (Moved inside functions to break circular dependency)
from app.worker import broker

logger = logging.getLogger(__name__)

@broker.task
async def send_telegram_task(chat_id: str | int, text: str, parse_mode: str = "Markdown"):
    """
    Background worker task to send Telegram messages.
    """
    try:
        from bot import bot
        # Ensure chat_id is int if it's numeric, otherwise pass as is (for usernames)
        target_id = chat_id
        try:
            target_id = int(str(chat_id))
        except (ValueError, TypeError):
            pass

        await bot.send_message(chat_id=target_id, text=text, parse_mode=parse_mode)
        return True
    except Exception as e:
        logger.error(f"Worker failed to send notification to {chat_id}: {e}")
        return False

class NotificationService:
    async def enqueue_notification(self, chat_id: str | int, text: str, parse_mode: str = "Markdown"):
        """
        Enqueues a notification to be sent by the background worker.
        """
        if not chat_id:
            logger.warning("⚠️ Skipping notification: no chat_id provided")
            return

        try:
            # Send to TaskIQ broker
            await send_telegram_task.kiq(chat_id, text, parse_mode)
            logger.info(f"📤 Notification enqueued for {chat_id}")
        except Exception as e:
            logger.error(f"Failed to enqueue notification for {chat_id}: {e}")
            try:
                # Fallback to direct send if broker fails
                from bot import bot
                asyncio.create_task(bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode))
                logger.info(f"📤 Fallback notification sent directly for {chat_id}")
            except Exception as fe:
                logger.error(f"Fallback notification also failed for {chat_id}: {fe}")



    async def send_level_up_notification(self, chat_id: int, old_level: int, new_level: int, lang: str = "en"):
        """Sends notifications for each level gained."""
        if new_level > old_level:
            from app.core.i18n import get_msg
            for lvl in range(old_level + 1, new_level + 1):
                msg = get_msg(lang, "level_up", level=lvl)
                await self.enqueue_notification(chat_id=chat_id, text=msg)

    async def send_system_message(self, chat_id: int, title: str, content: str):
        """Sends a standardized system announcement."""
        text = f"📢 *{title}*\n\n{content}"
        await self.enqueue_notification(chat_id=chat_id, text=text)

notification_service = NotificationService()
