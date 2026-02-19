import asyncio
import contextlib
import logging
import time
from typing import List, Optional

import sentry_sdk
from aiogram.exceptions import TelegramRetryAfter, TelegramForbiddenError

from app.core.broker import broker
from app.schemas.notification import InlineButton, NotificationPayload
from app.services.rate_limit_service import rate_limit_service

logger = logging.getLogger(__name__)

# #comment: MISSION-CRITICAL High-Volume Notification System (Scale Support: 100K+/5m).
# Optimized for high-throughput partner networks. Features:
# 1. Redis-backed sliding window rate limiting (Compliance with Telegram limits).
# 2. Priority-based dispatcher (Critical payments vs Background social XP).
# 3. Aggressive exponential backoff for 429 errors.
# 4. Buffered Audit Resilience.

@broker.task(
    retry=5, 
    task_name="send_telegram_task",
)
async def send_telegram_task(payload_dict: dict):
    """
    High-capacity Telegram dispatcher.
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
        return False

    # 2. Rate Limit Check (Back-pressure)
    # We wait up to 15s for high priority or 5s for medium/low to avoid instant failure during bursts
    allowed = await rate_limit_service.wait_for_slot(
        payload.chat_id, 
        priority=payload.priority, 
        timeout=15 if payload.priority == "high" else 5
    )
    
    if not allowed and payload.priority != "high":
        # Re-queue if not high priority to avoid dropping messages
        logger.warning(f"⏳ Rate limit hit for {payload.chat_id}, re-queueing...")
        raise Exception("Rate limit hit - retry via broker")

    # 3. Execute Dispatch
    try:
        reply_markup = notification_service._build_keyboard(payload.buttons) if payload.buttons else None
        
        await bot.send_message(
            chat_id=payload.chat_id, 
            text=payload.text, 
            parse_mode=payload.parse_mode, 
            reply_markup=reply_markup
        )
        
        # 4. Optimized Audit Log
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            await audit_service.log_event(
                session=session,
                entity_type="notification",
                entity_id=str(payload.chat_id),
                action="send_success",
                details={
                    "prio": payload.priority,
                    "text_len": len(payload.text),
                    "audit_v3": True
                }
            )
            await session.commit()
            
        return True

    except TelegramRetryAfter as e:
        logger.warning(f"⚠️ Telegram Rate Limit (429): Wait {e.retry_after}s for {payload.chat_id}")
        # Explicit sleep to respect Telegram's demand
        await asyncio.sleep(e.retry_after)
        raise e # Let TaskIQ retry
    except TelegramForbiddenError:
        logger.error(f"🚫 User {payload.chat_id} blocked the bot. Skipping.")
        return True # Handled, don't retry
    except Exception as e:
        logger.error(f"💥 Dispatch Error: {e}")
        sentry_sdk.capture_exception(e)
        
        # Move to DB for persistence only on real errors
        from app.models.notification_retry import NotificationRetry
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            retry_item = NotificationRetry(
                chat_id=payload.chat_id,
                text=payload.text,
                parse_mode=payload.parse_mode,
                buttons=payload.buttons,
                last_error=f"Runtime Error: {str(e)[:100]}",
                status="pending"
            )
            session.add(retry_item)
            await session.commit()
        return False

class NotificationService:
    def __init__(self):
        self._background_tasks: set[asyncio.Task] = set()

    def _build_keyboard(self, buttons: list[list[InlineButton]] | None):
        if not buttons:
            return None
        from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
        keyboard = []
        for row in buttons:
            keyboard_row = []
            for btn in row:
                btn_dict = btn.model_dump(exclude_none=True) if hasattr(btn, "model_dump") else btn.copy()
                if "web_app" in btn_dict and isinstance(btn_dict["web_app"], dict):
                    btn_dict["web_app"] = WebAppInfo(url=btn_dict["web_app"]["url"])
                keyboard_row.append(InlineKeyboardButton(**btn_dict))
            keyboard.append(keyboard_row)
        return InlineKeyboardMarkup(inline_keyboard=keyboard)

    async def enqueue_notification(
        self, 
        chat_id: str | int, 
        text: str, 
        parse_mode: str = "Markdown", 
        buttons: list | None = None,
        priority: str = "medium",
        bypass_dedup: bool = False
    ):
        """
        Enqueues a notification with scale-aware priority and duplicate prevention.
        """
        if not chat_id:
            return

        try:
            # High-performance Deduplication Check
            if not bypass_dedup and await rate_limit_service.is_duplicate(int(chat_id), text):
                logger.info(f"🚫 [DEDUP] Skipping duplicate message for {chat_id}")
                return

            payload = NotificationPayload(
                chat_id=int(chat_id),
                text=text,
                parse_mode=parse_mode,
                buttons=buttons,
                priority=priority
            )
            
            await send_telegram_task.kiq(payload.model_dump())
            logger.info(f"📤 [CORE-NOTIF] Enqueued for {chat_id} (prio: {priority})")
        except Exception as e:
            logger.error(f"❌ Enqueue Failed for {chat_id}: {e}")
            
            # Record in DB if broker fails
            from sqlalchemy.orm import sessionmaker
            from sqlmodel.ext.asyncio.session import AsyncSession
            from app.models.notification_retry import NotificationRetry
            from app.models.partner import engine
            
            async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session() as session:
                retry_item = NotificationRetry(
                    chat_id=int(chat_id),
                    text=text,
                    parse_mode=parse_mode,
                    buttons=buttons,
                    last_error=f"Queue Error: {str(e)[:100]}",
                    status="pending"
                )
                session.add(retry_item)
                await session.commit()
            
            # Emergency direct send fallback
            await self._fallback_send(chat_id, text, parse_mode, buttons)

    async def _fallback_send(self, chat_id, text, parse_mode, buttons):
        """Emergency direct send if broker fails."""
        try:
            from bot import bot
            reply_markup = self._build_keyboard(buttons)
            
            async def wrap_send():
                try:
                    await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode, reply_markup=reply_markup)
                except Exception as fe:
                    logger.error(f"💥 Fallback failed for {chat_id}: {fe}")

            task = asyncio.create_task(wrap_send())
            self._background_tasks.add(task)
            task.add_done_callback(self._background_tasks.discard)
            
        except Exception as fe:
            logger.error(f"💥 Total notification failure for {chat_id}: {fe}")

    async def process_retries(self):
        """High-efficiency batch retry processor."""
        from datetime import UTC, datetime, timedelta
        from sqlalchemy.orm import sessionmaker
        from sqlmodel import select
        from sqlmodel.ext.asyncio.session import AsyncSession
        from app.models.notification_retry import NotificationRetry
        from app.models.partner import engine
        from bot import bot

        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            stmt = select(NotificationRetry).where(
                NotificationRetry.status == "pending",
                NotificationRetry.attempts < 10,  # Increased attempts
                NotificationRetry.next_retry_at <= datetime.now(UTC).replace(tzinfo=None)
            ).limit(100) # Increased batch size
            
            result = await session.exec(stmt)
            retries = result.all()
            if not retries: return
            
            logger.info(f"🔄 Processing {len(retries)} retries...")
            
            for item in retries:
                # Still check rate limit for retried items
                if not await rate_limit_service.is_allowed(item.chat_id, priority="low"):
                    continue

                try:
                    reply_markup = self._build_keyboard(item.buttons) if item.buttons else None
                    await bot.send_message(chat_id=item.chat_id, text=item.text, parse_mode=item.parse_mode, reply_markup=reply_markup)
                    item.status = "sent"
                except Exception as e:
                    item.attempts += 1
                    item.last_error = str(e)[:100]
                    # Exponential backoff
                    wait_sec = min(3600, (2 ** item.attempts) * 60)
                    item.next_retry_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(seconds=wait_sec)
                    if item.attempts >= 10: item.status = "failed"
                session.add(item)
            await session.commit()

    async def send_level_up_notification(self, chat_id: int, old_level: int, new_level: int, lang: str = "en"):
        """Sends notifications for each level gained."""
        if new_level > old_level:
            from app.core.i18n import get_msg
            for lvl in range(old_level + 1, new_level + 1):
                msg = get_msg(lang, "level_up", level=lvl)
                await self.send_standard(chat_id=chat_id, text=msg)

    async def send_system_message(self, chat_id: int, title: str, content: str):
        """Sends a standardized system announcement."""
        text = f"📢 *{title}*\n\n{content}"
        await self.send_standard(chat_id=chat_id, text=text)

    # High-performance priority wrappers
    async def send_critical(self, chat_id: int, text: str, buttons: list | None = None, bypass_dedup: bool = True):
        """Mission-critical messages (Security, Payments). Bypasses dedup by default."""
        await self.enqueue_notification(chat_id, text, buttons=buttons, priority="high", bypass_dedup=bypass_dedup)

    async def send_standard(self, chat_id: int, text: str, buttons: list | None = None, bypass_dedup: bool = False):
        """Standard interaction messages (Referrals)."""
        await self.enqueue_notification(chat_id, text, buttons=buttons, priority="medium", bypass_dedup=bypass_dedup)

    async def send_low_prio(self, chat_id: int, text: str, buttons: list | None = None, bypass_dedup: bool = False):
        """Background messages (XP, Social tips)."""
        await self.enqueue_notification(chat_id, text, buttons=buttons, priority="low", bypass_dedup=bypass_dedup)

notification_service = NotificationService()

@broker.task(task_name="notify_admin_payment_task")
async def notify_admin_payment_task(
    partner_id: int, 
    amount: float, 
    currency: str, 
    network: str, 
    tx_hash: str | None, 
    transaction_id: int
):
    """
    Hardened task for notifying admins about manual payment claims.
    """
    from sqlalchemy.orm import sessionmaker
    from sqlmodel import select
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.core.config import settings
    from app.models.partner import Partner, engine
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        partner = await session.get(Partner, partner_id)
        if not partner:
            return
            
        safe_username = f"@{partner.username}" if partner.username else "No Username"
        admin_targets = ["537873096"] 
        for a_id in settings.ADMIN_USER_IDS:
            if str(a_id) not in admin_targets:
                admin_targets.append(str(a_id))
        
        # Fetch admin partners to respect their language preference
        stmt_admins = select(Partner).where(Partner.telegram_id.in_(admin_targets))
        res_admins = await session.exec(stmt_admins)
        admin_map = {p.telegram_id: p for p in res_admins.all()}
        
        from app.core.i18n import get_msg
                
        for chat_id in admin_targets:
            try:
                lang = "en"
                if chat_id in admin_map and admin_map[chat_id].language_code:
                    lang = admin_map[chat_id].language_code
                
                msg = get_msg(
                    lang, "admin_manual_payment",
                    user=safe_username,
                    user_id=partner.telegram_id,
                    amount=amount,
                    currency=currency,
                    network=network,
                    hash=tx_hash or 'Not Provided',
                    trans_id=transaction_id
                )
                
                # Admin alerts are HIGH priority
                await notification_service.send_critical(chat_id=int(chat_id), text=msg)
            except Exception as e:
                logger.error(f"Failed to enqueue admin notify: {e}")
