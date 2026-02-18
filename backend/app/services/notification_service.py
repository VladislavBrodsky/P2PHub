import asyncio
import contextlib
import logging
from typing import List

import sentry_sdk

from app.schemas.notification import InlineButton, NotificationPayload
from app.worker import broker

logger = logging.getLogger(__name__)

# #comment: MISSION-CRITICAL Core System (Audit Phase 4).
# This system handles all Telegram communications. It is now hardened with:
# 1. Pydantic-based payload validation.
# 2. Permanent audit logging of all outgoing messages.
# 3. Robust retry logic for transient Telegram API failures.

@broker.task(retry=3)
async def send_telegram_task(payload_dict: dict):
    """
    Optimized background worker task to send Telegram messages.
    Uses Pydantic for validation and structured data.
    """
    from sqlalchemy.orm import sessionmaker
    from sqlmodel.ext.asyncio.session import AsyncSession
    from app.models.partner import engine
    from app.services.audit_service import audit_service
    from bot import bot

    # 1. Validate Payload
    try:
        payload = NotificationPayload.model_validate(payload_dict)
    except Exception as e:
        logger.error(f"❌ Notification Schema Violation: {e}")
        sentry_sdk.capture_exception(e)
        return False

    # 2. Execute Dispatch
    try:
        reply_markup = notification_service._build_keyboard(payload.buttons) if payload.buttons else None
        
        await bot.send_message(
            chat_id=payload.chat_id, 
            text=payload.text, 
            parse_mode=payload.parse_mode, 
            reply_markup=reply_markup
        )
        
        # 3. Permanent Audit Log (Success)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            await audit_service.log_event(
                session=session,
                entity_type="notification",
                entity_id=str(payload.chat_id),
                action="send_success",
                details={
                    "text_preview": payload.text[:50],
                    "parse_mode": payload.parse_mode,
                    "has_buttons": payload.buttons is not None
                }
            )
            await session.commit()
            
        return True

    except Exception as e:
        logger.error(f"⚠️ Notification Dispatch Failed for {payload.chat_id}: {e}")
        sentry_sdk.capture_exception(e)
        
        # #comment: Move to Persistence Layer on failure
        # This ensures that even if Telegram is down or worker crashes, the message isn't lost.
        from app.models.notification_retry import NotificationRetry
        from sqlalchemy.orm import sessionmaker
        from sqlmodel.ext.asyncio.session import AsyncSession
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            # Check if already exists to avoid duplicates
            retry_item = NotificationRetry(
                chat_id=payload.chat_id,
                text=payload.text,
                parse_mode=payload.parse_mode,
                buttons=payload.buttons,
                last_error=str(e),
                status="pending"
            )
            session.add(retry_item)
            
            await audit_service.log_event(
                session=session,
                entity_type="notification",
                entity_id=str(payload.chat_id),
                action="send_failed_moved_to_retry",
                details={"error": str(e)}
            )
            await session.commit()
            
        return False

class NotificationService:
    def __init__(self):
        self._background_tasks: set[asyncio.Task] = set()

    def _build_keyboard(self, buttons: list[list[InlineButton]] | None):
        """Helper to build AIogram InlineKeyboardMarkup from Pydantic models."""
        if not buttons:
            return None
        from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
        keyboard = []
        for row in buttons:
            keyboard_row = []
            for btn in row:
                # Handle both Pydantic models and raw dicts (for fallback system resilience)
                btn_dict = btn.model_dump(exclude_none=True) if hasattr(btn, "model_dump") else btn.copy()
                
                if "web_app" in btn_dict and isinstance(btn_dict["web_app"], dict):
                    btn_dict["web_app"] = WebAppInfo(url=btn_dict["web_app"]["url"])
                keyboard_row.append(InlineKeyboardButton(**btn_dict))
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
            payload = NotificationPayload(
                chat_id=int(chat_id),
                text=text,
                parse_mode=parse_mode,
                buttons=buttons
            )
            
            await send_telegram_task.kiq(payload.model_dump())
            logger.info(f"📤 [CORE-NOTIF] Enqueued for {chat_id}")
        except Exception as e:
            logger.error(f"❌ Core Notification Enqueue Failed for {chat_id}: {e}")
            
            # #comment: CRITICAL - If broker fails, we MUST record it in Persistent DB Layer.
            from app.models.notification_retry import NotificationRetry
            from app.models.partner import engine
            from app.services.audit_service import audit_service
            from sqlalchemy.orm import sessionmaker
            from sqlmodel.ext.asyncio.session import AsyncSession
            
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session() as session:
                retry_item = NotificationRetry(
                    chat_id=int(chat_id),
                    text=text,
                    parse_mode=parse_mode,
                    buttons=buttons,
                    last_error=f"Enqueue Error: {e}",
                    status="pending"
                )
                session.add(retry_item)
                
                await audit_service.log_event(
                    session=session,
                    entity_type="notification",
                    entity_id=str(chat_id),
                    action="enqueue_failed_saved_to_db",
                    details={"error": str(e), "text_preview": text[:50]}
                )
                await session.commit()
            
            # Still try fallback if it's safe
            await self._fallback_send(chat_id, text, parse_mode, buttons)

    async def _fallback_send(self, chat_id, text, parse_mode, buttons):
        """Direct fallback (fire-and-forget) if broker is down."""
        try:
            from bot import bot
            from app.models.partner import engine
            from app.services.audit_service import audit_service
            from sqlalchemy.orm import sessionmaker
            from sqlmodel.ext.asyncio.session import AsyncSession

            reply_markup = self._build_keyboard(buttons)
            
            # Wrap telegram call to catch errors
            async def wrap_send():
                try:
                    await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode, reply_markup=reply_markup)
                    # Log success
                    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
                    async with async_session() as session:
                        await audit_service.log_event(session=session, entity_type="notification", entity_id=str(chat_id), action="fallback_success", details={"text_preview": text[:50]})
                        await session.commit()
                except Exception as fe:
                    logger.error(f"💥 Fallback failed for {chat_id}: {fe}")
                    # Failure is already handled by being in NotificationRetry from the enqueue catch

            task = asyncio.create_task(wrap_send())
            self._background_tasks.add(task)
            task.add_done_callback(self._background_tasks.discard)
            
            logger.info(f"⚡ [FALLBACK-NOTIF] Dispatched directly for {chat_id}")
                
        except Exception as fe:
            logger.error(f"💥 Total notification failure for {chat_id}: {fe}")

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

    async def process_retries(self):
        """
        Processes pending notifications from the NotificationRetry table.
        This is called by the monthly_maintenance_service task every minute.
        """
        from datetime import datetime, UTC, timedelta
        from app.models.notification_retry import NotificationRetry
        from app.models.partner import engine
        from sqlalchemy.orm import sessionmaker
        from sqlmodel import select
        from sqlmodel.ext.asyncio.session import AsyncSession
        from bot import bot

        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            stmt = select(NotificationRetry).where(
                NotificationRetry.status == "pending",
                NotificationRetry.attempts < 5,
                NotificationRetry.next_retry_at <= datetime.now(UTC).replace(tzinfo=None)
            ).limit(20)
            
            result = await session.exec(stmt)
            retries = result.all()
            
            if not retries:
                return
            
            logger.info(f"🔄 Retrying {len(retries)} failed notifications...")
            
            for item in retries:
                try:
                    reply_markup = self._build_keyboard(item.buttons) if item.buttons else None
                    await bot.send_message(
                        chat_id=item.chat_id,
                        text=item.text,
                        parse_mode=item.parse_mode,
                        reply_markup=reply_markup
                    )
                    item.status = "sent"
                    logger.info(f"✅ Successfully retried notification to {item.chat_id}")
                except Exception as e:
                    item.attempts += 1
                    item.last_error = str(e)
                    # Exponential backoff: 2^attempts * 60 seconds
                    item.next_retry_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(seconds=min(3600, (2 ** item.attempts) * 60))
                    if item.attempts >= 5:
                        item.status = "failed"
                    logger.warning(f"⚠️ Retry {item.attempts} failed for {item.chat_id}: {e}")
                
                session.add(item)
            
            await session.commit()

notification_service = NotificationService()

