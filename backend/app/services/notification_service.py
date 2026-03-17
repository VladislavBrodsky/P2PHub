import asyncio
import contextlib
import logging
import time
from typing import List, Optional

import sentry_sdk
from aiogram.exceptions import TelegramForbiddenError, TelegramRetryAfter

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
    from sqlmodel import select
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.models.notification_retry import NotificationRetry
    from app.models.partner import Partner, engine
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

    try:
        reply_markup = notification_service._build_keyboard(payload.buttons) if payload.buttons else None
        
        try:
            target_chat_id = int(payload.chat_id)
        except (ValueError, TypeError):
            target_chat_id = payload.chat_id

        await bot.send_message(
            chat_id=target_chat_id, 
            text=payload.text, 
            parse_mode=payload.parse_mode, 
            reply_markup=reply_markup
        )
        
        # 3. Mark success in DB and Log
        async_session_m = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session_m() as audit_session:
            # Find the last pending retry for this user and mark as sent
            stmt = select(NotificationRetry).where(
                NotificationRetry.chat_id == str(payload.chat_id),
                NotificationRetry.status == "pending"
            ).order_by(NotificationRetry.created_at.desc()).limit(1)
            res = await audit_session.execute(stmt)
            retry = res.scalars().first()
            if retry:
                retry.status = "sent"
                await audit_session.commit()

            await audit_service.log_event(
                session=audit_session,
                entity_type="notification",
                entity_id=str(payload.chat_id),
                action="send_success",
                details={
                    "prio": payload.priority,
                    "text_len": len(payload.text),
                    "audit_v3": True
                }
            )
            await audit_session.commit()
            
        return True

    except TelegramRetryAfter as e:
        logger.warning(f"⚠️ Telegram Rate Limit (429): Wait {e.retry_after}s for {payload.chat_id}")
        
        # #comment: Advanced Reliability (Phase 2)
        # Circuit Breaker: Trip the breaker universally so other tasks pause
        await rate_limit_service.trip_circuit_breaker(e.retry_after)
        
        # Explicit sleep to respect Telegram's demand for this specific task
        await asyncio.sleep(e.retry_after)
        raise e # Let TaskIQ retry
    except TelegramForbiddenError:
        logger.error(f"🚫 User {payload.chat_id} blocked the bot. Pausing notifications.")
        # Mark user as paused to stop redundant background tasks
        try:
            async_session_p = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session_p() as pause_session:
                # chat_id in payload is str/int telegram_id
                stmt = select(Partner).where(Partner.telegram_id == str(payload.chat_id))
                user = (await pause_session.exec(stmt)).first()
                if user:
                    user.notifications_paused = True
                    pause_session.add(user)
                    await pause_session.commit()
                    # Cache in Redis for fast skipping in enqueue_notification
                    await rate_limit_service.mark_user_blocked(str(payload.chat_id))
        except Exception as ue:
            logger.error(f"Failed to pause notifications for {payload.chat_id}: {ue}")
        return True # Handled, don't retry
    except Exception as e:
        err_msg = str(e).lower()
        # Terminal errors: No point in retrying
        if "chat not found" in err_msg or "peer id invalid" in err_msg or "user_id_invalid" in err_msg:
            logger.error(f"❌ Terminal Dispatch Error (No Retry): {e} for {payload.chat_id}")
            return True # Pretend success to stop TaskIQ retries, but we didn't send it

        logger.error(f"💥 Dispatch Error: {e}")
        sentry_sdk.capture_exception(e)
        
        # Record dispatch error for persistent retry mechanism
        try:
            async_session_e = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
            async with async_session_e() as error_session:
                stmt = select(NotificationRetry).where(
                    NotificationRetry.chat_id == str(payload.chat_id),
                    NotificationRetry.status == "pending"
                ).order_by(NotificationRetry.created_at.desc()).limit(1)
                res = await error_session.execute(stmt)
                retry = res.scalars().first()
                if retry:
                    retry.status = "pending" # Keep pending so scheduler can pick it up
                    retry.last_error = str(e)
                    retry.attempts += 1
                    error_session.add(retry)
                    await error_session.commit()
        except Exception as de:
            logger.error(f"Failed to record dispatch error for {payload.chat_id}: {de}")
            
        return False # Let TaskIQ retry (up to 5 times)

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
        bypass_dedup: bool = False,
        salt: str = ""
    ):
        """
        Enqueues a notification with scale-aware priority and duplicate prevention.
        """
        if not chat_id:
            return

        try:
            # #comment: Advanced Reliability (Phase 2)
            # Circuit Breaker Check: If Telegram is actively rate-limiting us, pause enqueuing
            # or delay the task processing.
            if await rate_limit_service.is_circuit_breaker_tripped():
                logger.warning(f"🔌 Circuit Breaker Active. Delaying enqueue for {chat_id}")
                await asyncio.sleep(5) # Add backpressure
                
            # 0. Check if user blocked the bot (Redis-cached check)
            if priority != "high" and await rate_limit_service.is_blocked(str(chat_id)):
                logger.info(f"🚫 [BLOCKED] Skipping message for {chat_id}")
                return

            # High-performance Deduplication Check
            if not bypass_dedup and await rate_limit_service.is_duplicate(str(chat_id), text, salt=salt):
                logger.info(f"🚫 [DEDUP] Skipping duplicate for {chat_id} (salt: {salt})")
                return

            payload = NotificationPayload(
                chat_id=str(chat_id),
                text=text,
                parse_mode=parse_mode,
                buttons=buttons,
                priority=priority,
                salt=salt
            )
            
            await send_telegram_task.kiq(payload.model_dump())
            logger.info(f"📤 [CORE-NOTIF] Enqueued for {chat_id} (prio: {priority}, salt: {salt})")
            
            # High-performance Buffered Logger (Zero DB impact during 200K broadcast)
            try:
                from app.services.audit_service import audit_service
                await audit_service.log_notification_buffered(
                    chat_id=str(chat_id),
                    event_type=salt or "unknown",
                    status="enqueued",
                    priority=priority,
                    salt=salt
                )
            except Exception as ae:
                logger.warning(f"Failed to log notification enqueue (buffered): {ae}")


        except Exception as e:
            logger.error(f"❌ Enqueue Failed for {chat_id}: {e}")
            
            # Record in DB if broker fails
            try:
                from sqlalchemy.orm import sessionmaker
                from sqlmodel.ext.asyncio.session import AsyncSession

                from app.models.notification_retry import NotificationRetry
                from app.models.partner import engine
                
                async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
                async with async_session() as session:
                    retry_item = NotificationRetry(
                        chat_id=str(chat_id),
                        text=text,
                        parse_mode=parse_mode,
                        buttons=buttons,
                        last_error=f"Queue Error: {str(e)[:100]}",
                        status="pending"
                    )
                    session.add(retry_item)
                    await session.commit()
                    retry_item_id = retry_item.id
            except Exception as de:
                logger.error(f"Failed to save retry record: {de}")
                retry_item_id = None
            
            # Emergency direct send fallback
            await self._fallback_send(chat_id, text, parse_mode, buttons, retry_item_id=retry_item_id)

    async def _fallback_send(self, chat_id, text, parse_mode, buttons, retry_item_id: int | None = None):
        """Emergency direct send if broker fails."""
        try:
            from bot import bot
            reply_markup = self._build_keyboard(buttons)
            
            async def wrap_send():
                try:
                    await bot.send_message(chat_id=int(chat_id), text=text, parse_mode=parse_mode, reply_markup=reply_markup)
                    # Add audit log for fallback success so we know what happened
                    from sqlalchemy.orm import sessionmaker
                    from sqlmodel.ext.asyncio.session import AsyncSession

                    from app.models.partner import engine
                    from app.services.audit_service import audit_service
                    
                    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
                    async with async_session() as session:
                        if retry_item_id:
                            from app.models.notification_retry import NotificationRetry
                            item = await session.get(NotificationRetry, retry_item_id)
                            if item:
                                item.status = "sent"
                                item.last_error = None
                                session.add(item)

                        await audit_service.log_event(
                            session=session,
                            entity_type="notification",
                            entity_id=str(chat_id),
                            action="fallback_success",
                            details={"prio": "emergency", "text_len": len(text)}
                        )
                        await session.commit()
                except Exception as fe:
                    logger.error(f"💥 Fallback failed for {chat_id}: {fe}")
                    
                    try:
                        from sqlalchemy.orm import sessionmaker
                        from sqlmodel.ext.asyncio.session import AsyncSession

                        from app.models.partner import engine
                        from app.services.audit_service import audit_service
                        
                        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
                        async with async_session() as session:
                            await audit_service.log_event(
                                session=session,
                                entity_type="notification",
                                entity_id=str(chat_id),
                                action="fallback_error",
                                details={"error": str(fe)[:200], "prio": "emergency"}
                            )
                            await session.commit()
                    except Exception:
                        pass

            # Await wrap_send directly to ensure delivery instead of using a background task
            # that might be cancelled if the main process exits (e.g., during tests)
            await wrap_send()
            
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
                    await bot.send_message(chat_id=int(item.chat_id), text=item.text, parse_mode=item.parse_mode, reply_markup=reply_markup)
                    item.status = "sent"
                    item.last_error = None # Clear error on success
                except TelegramForbiddenError:
                    logger.error(f"🚫 User {item.chat_id} blocked the bot during retry. Pausing.")
                    item.status = "failed"
                    item.last_error = "User Blocked"
                    # Mark in DB and Redis
                    try:
                        from app.models.partner import Partner
                        stmt_u = select(Partner).where(Partner.telegram_id == str(item.chat_id))
                        usr = (await session.exec(stmt_u)).first()
                        if usr:
                            usr.notifications_paused = True
                            session.add(usr)
                        await rate_limit_service.mark_user_blocked(str(item.chat_id))
                    except Exception as ue:
                        logger.error(f"Failed to sync block for {item.chat_id}: {ue}")
                except Exception as e:
                    err_msg = str(e).lower()
                    if "chat not found" in err_msg or "peer id invalid" in err_msg or "user_id_invalid" in err_msg:
                        logger.error(f"❌ Terminal Retry Error: {e} for {item.chat_id}. Marking as failed.")
                        item.status = "failed"
                        item.last_error = f"Terminal: {str(e)[:50]}"
                    else:
                        item.attempts += 1
                        item.last_error = str(e)[:100]
                        # Exponential backoff
                        wait_sec = min(3600, (2 ** item.attempts) * 60)
                        item.next_retry_at = datetime.now(UTC).replace(tzinfo=None) + timedelta(seconds=wait_sec)
                        if item.attempts >= 10: item.status = "failed"
                session.add(item)
            await session.commit()

    async def send_level_up_notification(self, chat_id: int, old_level: int, new_level: int, lang: str = "en"):
        """Sends notifications for levels gained."""
        if new_level > old_level:
            from app.core.i18n import get_msg
            if new_level - old_level > 1:
                # Consolidated notification for massive gain
                msg = get_msg(lang, "level_up_multi", old_level=old_level, new_level=new_level)
                await self.send_standard(chat_id=chat_id, text=msg)
            else:
                # Standard single level up
                msg = get_msg(lang, "level_up", level=new_level)
                await self.send_standard(chat_id=chat_id, text=msg)

    async def send_system_message(self, chat_id: int, title: str, content: str):
        """Sends a standardized system announcement."""
        text = f"📢 *{title}*\n\n{content}"
        await self.send_standard(chat_id=chat_id, text=text)

    # High-performance priority wrappers
    async def send_critical(self, chat_id: int | str, text: str, buttons: list | None = None, bypass_dedup: bool = True, parse_mode: str = "Markdown", salt: str = ""):
        """Mission-critical messages (Security, Payments). Bypasses dedup by default."""
        await self.enqueue_notification(str(chat_id), text, parse_mode=parse_mode, buttons=buttons, priority="high", bypass_dedup=bypass_dedup, salt=salt)

    async def send_standard(self, chat_id: int | str, text: str, buttons: list | None = None, bypass_dedup: bool = False, parse_mode: str = "Markdown", salt: str = ""):
        """Standard interaction messages (Referrals)."""
        await self.enqueue_notification(str(chat_id), text, parse_mode=parse_mode, buttons=buttons, priority="medium", bypass_dedup=bypass_dedup, salt=salt)

    async def send_low_prio(self, chat_id: int | str, text: str, buttons: list | None = None, bypass_dedup: bool = False, parse_mode: str = "Markdown", salt: str = ""):
        """Background messages (XP, Social tips)."""
        await self.enqueue_notification(str(chat_id), text, parse_mode=parse_mode, buttons=buttons, priority="low", bypass_dedup=bypass_dedup, salt=salt)

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
        admin_targets = [] 
        for a_id in settings.ADMIN_USER_IDS:
            if str(a_id) not in admin_targets:
                admin_targets.append(str(a_id))
        
        # Fallback if settings are empty
        if not admin_targets:
            admin_targets = ["716720099"]
        
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
                
                # Admin alerts are HIGH priority — send with HTML parse mode to avoid Markdown entity errors
                await notification_service.send_critical(chat_id=str(chat_id), text=msg, parse_mode="HTML")
            except Exception as e:
                logger.error(f"Failed to enqueue admin notify: {e}")
