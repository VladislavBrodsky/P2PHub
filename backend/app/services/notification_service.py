import asyncio
import contextlib
import logging

import sentry_sdk

# from bot import bot (Moved inside functions to break circular dependency)
from app.worker import broker

logger = logging.getLogger(__name__)

@broker.task
@broker.task
async def send_telegram_task(chat_id: str | int, text: str, parse_mode: str = "Markdown", buttons: list | None = None):
    """
    Background worker task to send Telegram messages with optional buttons.
    """
    try:
        from bot import bot
        
        target_id = chat_id
        with contextlib.suppress(ValueError, TypeError):
            target_id = int(str(chat_id))

        reply_markup = notification_service._build_keyboard(buttons) if buttons else None
        await bot.send_message(chat_id=target_id, text=text, parse_mode=parse_mode, reply_markup=reply_markup)
        return True
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"Worker failed to send notification to {chat_id}: {e}")
        return False

class NotificationService:
    def __init__(self):
        self._background_tasks: set[asyncio.Task] = set()

    def _build_keyboard(self, buttons: list | None):
        """Helper to build AIogram InlineKeyboardMarkup from a list of button rows."""
        if not buttons:
            return None
        from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
        keyboard = []
        for row in buttons:
            keyboard_row = []
            for btn in row:
                btn_copy = btn.copy()
                if "web_app" in btn_copy and isinstance(btn_copy["web_app"], dict):
                    btn_copy["web_app"] = WebAppInfo(url=btn_copy["web_app"]["url"])
                keyboard_row.append(InlineKeyboardButton(**btn_copy))
            keyboard.append(keyboard_row)
        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    async def enqueue_notification(self, chat_id: str | int, text: str, parse_mode: str = "Markdown", buttons: list | None = None):
        """
        Enqueues a notification with optional inline buttons.
        """
        if not chat_id:
            logger.warning("⚠️ Skipping notification: no chat_id provided")
            return

        try:
            await send_telegram_task.kiq(chat_id=chat_id, text=text, parse_mode=parse_mode, buttons=buttons)
            logger.info(f"📤 Notification enqueued via TaskIQ for {chat_id}")
        except Exception as e:
            logger.error(f"Failed to enqueue notification for {chat_id}: {e}")
            await self._fallback_send(chat_id, text, parse_mode, buttons)

    async def _fallback_send(self, chat_id, text, parse_mode, buttons):
        """Direct fallback sending via asyncio.create_task."""
        try:
            from bot import bot
            reply_markup = self._build_keyboard(buttons)
            
            task = asyncio.create_task(
                bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode, reply_markup=reply_markup)
            )
            self._background_tasks.add(task)
            task.add_done_callback(self._background_tasks.discard)
            
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
