import asyncio
import logging

# from bot import bot (Moved inside functions to break circular dependency)
from app.worker import broker
import sentry_sdk

logger = logging.getLogger(__name__)

@broker.task
async def send_telegram_task(chat_id: str | int, text: str, parse_mode: str = "Markdown", buttons: list = None):
    """
    Background worker task to send Telegram messages with optional buttons.
    buttons: List of rows, each row is a list of dicts with 'text' and 'url' or 'callback_data'.
    """
    try:
        # #comment: Dynamically construct InlineKeyboardMarkup for notifications.
        # This allows us to send interactive buttons (links to the app, balance checks)
        # even from background worker tasks, increasing user re-engagement.
        from bot import bot
        from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
        
        # Ensure chat_id is int if it's numeric
        target_id = chat_id
        try:
            target_id = int(str(chat_id))
        except (ValueError, TypeError):
            pass

        reply_markup = None
        if buttons:
            keyboard = []
            for row in buttons:
                keyboard_row = []
                for btn in row:
                    keyboard_row.append(InlineKeyboardButton(**btn))
                keyboard.append(keyboard_row)
            reply_markup = InlineKeyboardMarkup(inline_keyboard=keyboard)

        await bot.send_message(chat_id=target_id, text=text, parse_mode=parse_mode, reply_markup=reply_markup)
        return True
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"Worker failed to send notification to {chat_id}: {e}")
        return False

class NotificationService:
    async def enqueue_notification(self, chat_id: str | int, text: str, parse_mode: str = "Markdown", buttons: list = None):
        """
        Enqueues a notification with optional inline buttons.
        """
        # #comment: We use a list of buttons instead of InlineKeyboardMarkup objects 
        # so that the data can be serialized to JSON and sent through the TaskIQ broker (Redis).
        if not chat_id:
            logger.warning("⚠️ Skipping notification: no chat_id provided")
            return

        try:
            # Send to TaskIQ broker
            await send_telegram_task.kiq(chat_id, text, parse_mode, buttons)
            logger.info(f"📤 Notification enqueued for {chat_id}")
        except Exception as e:
            logger.error(f"Failed to enqueue notification for {chat_id}: {e}")
            try:
                # #comment: Direct fallback sending via asyncio.create_task.
                # If the Redis broker is disconnected or the worker is overloaded, 
                # we send the message directly from the API process to ensure 100% delivery.
                from bot import bot
                from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
                
                reply_markup = None
                if buttons:
                    keyboard = []
                    for row in buttons:
                        keyboard_row = []
                        for btn in row:
                            keyboard_row.append(InlineKeyboardButton(**btn))
                        keyboard.append(keyboard_row)
                    reply_markup = InlineKeyboardMarkup(inline_keyboard=keyboard)

                asyncio.create_task(bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode, reply_markup=reply_markup))
                logger.info(f"📤 Fallback notification sent directly for {chat_id}")
            except Exception as fe:
                sentry_sdk.capture_exception(fe)
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
