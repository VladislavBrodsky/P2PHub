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
        # We create a fresh session for the worker to avoid state pollution
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
        
        # Log failure to Sentry and Audit
        sentry_sdk.capture_exception(e)
        
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            await audit_service.log_event(
                session=session,
                entity_type="notification",
                entity_id=str(payload.chat_id),
                action="send_failed",
                details={"error": str(e)}
            )
            await session.commit()
            
        # Raise to trigger TaskIQ retry if it's potentially transient
        raise e

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
        Uses Pydantic for validation BEFORE enqueuing to prevent zombie tasks.
        """
        if not chat_id:
            logger.warning("⚠️ Skipping notification: no chat_id provided")
            return

        try:
            # High-speed validation before serialization
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
            # #comment: CRITICAL - If broker fails, we MUST record it in AuditLog before falling back.
            # This helps distinguish between 'Worker Down' and 'Telegram Rejected'.
            from sqlalchemy.orm import sessionmaker
            from app.models.partner import engine
            from app.services.audit_service import audit_service
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session() as session:
                await audit_service.log_event(
                    session=session,
                    entity_type="notification",
                    entity_id=str(chat_id),
                    action="enqueue_failed",
                    details={"error": str(e), "text_preview": text[:50]}
                )
                await session.commit()
            
            await self._fallback_send(chat_id, text, parse_mode, buttons)

    async def _fallback_send(self, chat_id, text, parse_mode, buttons):
        """Direct fallback (fire-and-forget) if broker is down."""
        try:
            from bot import bot
            from app.services.audit_service import audit_service
            from sqlalchemy.orm import sessionmaker
            from app.models.partner import engine
            
            reply_markup = self._build_keyboard(buttons)
            task = asyncio.create_task(
                bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode, reply_markup=reply_markup)
            )
            self._background_tasks.add(task)
            task.add_done_callback(self._background_tasks.discard)
            
            logger.info(f"⚡ [FALLBACK-NOTIF] Dispatched directly for {chat_id}")
            
            # #comment: Log fallback success to audit trail
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session() as session:
                await audit_service.log_event(
                    session=session,
                    entity_type="notification",
                    entity_id=str(chat_id),
                    action="fallback_sent",
                    details={"text_preview": text[:50]}
                )
                await session.commit()
                
        except Exception as fe:
            sentry_sdk.capture_exception(fe)
            logger.error(f"💥 Total notification failure for {chat_id}: {fe}")
            # Final failure log
            from sqlalchemy.orm import sessionmaker
            from app.models.partner import engine
            from app.services.audit_service import audit_service
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            with contextlib.suppress(Exception):
                async with async_session() as session:
                    await audit_service.log_event(
                        session=session,
                        entity_type="notification",
                        entity_id=str(chat_id),
                        action="total_failure",
                        details={"error": str(fe)}
                    )
                    await session.commit()



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
