import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.notification_retry import NotificationRetry
from app.services.notification_service import (
    NotificationService,
    notification_service,
    send_telegram_task,
)
from app.services.rate_limit_service import rate_limit_service


@pytest.mark.asyncio
class TestNotificationStructuredSuite:
    @pytest.fixture(autouse=True)
    async def setup_service_logic(self):
        # 1. Capture original conftest mocks
        self.orig_enqueue = notification_service.enqueue_notification
        self.orig_send_std = notification_service.send_standard
        self.orig_send_crit = notification_service.send_critical
        
        # 2. Swap back to REAL logic for this test class
        notification_service.enqueue_notification = NotificationService.enqueue_notification.__get__(notification_service, NotificationService)
        notification_service.send_standard = NotificationService.send_standard.__get__(notification_service, NotificationService)
        notification_service.send_critical = NotificationService.send_critical.__get__(notification_service, NotificationService)
        
        yield
        
        # 3. Restore conftest mocks
        notification_service.enqueue_notification = self.orig_enqueue
        notification_service.send_standard = self.orig_send_std
        notification_service.send_critical = self.orig_send_crit

    async def test_bottleneck_rate_limiting(self, session: AsyncSession):
        """
        Detect Bottlenecks: Simultaneous messages for the same user.
        """
        chat_id = "999123"
        text = "Batch test message"
        
        with patch("app.services.notification_service.send_telegram_task.kiq", new_callable=AsyncMock) as mock_kiq:
            with patch("app.services.rate_limit_service.rate_limit_service.is_duplicate", return_value=False):
                with patch("app.services.rate_limit_service.rate_limit_service.is_blocked", return_value=False):
                    tasks = [
                        notification_service.send_standard(chat_id, f"{text} {i}") 
                        for i in range(5)
                    ]
                    await asyncio.gather(*tasks)
                    assert mock_kiq.call_count == 5

    async def test_broken_logic_retry_mechanism(self, session: AsyncSession):
        """
        Broken Logic: Ensure retry processor correctly updates DB and handles errors.
        """
        retry_item = NotificationRetry(
            chat_id="888", text="Retry Me", status="pending", attempts=0
        )
        session.add(retry_item)
        await session.commit()
        await session.refresh(retry_item)

        with patch("bot.bot.send_message", new_callable=AsyncMock) as mock_send:
            with patch("app.services.rate_limit_service.rate_limit_service.is_allowed", return_value=True):
                await notification_service.process_retries()
                
                await session.refresh(retry_item)
                assert retry_item.status == "sent"
                assert retry_item.last_error is None
                mock_send.assert_called_once()

    async def test_critical_failure_fallback_flow(self, session: AsyncSession):
        """
        Critical Flow: Logic for when Redis/Broker is completely down.
        """
        chat_id = "7771"
        text = "Emergency fallback test"

        with patch("app.services.notification_service.send_telegram_task.kiq", side_effect=Exception("Redis Down")):
            with patch("bot.bot.send_message", new_callable=AsyncMock) as mock_send:
                with patch("app.services.audit_service.audit_service.log_event", new_callable=AsyncMock):
                    with patch("app.services.rate_limit_service.rate_limit_service.is_duplicate", return_value=False):
                        with patch("app.services.rate_limit_service.rate_limit_service.is_blocked", return_value=False):
                            await notification_service.enqueue_notification(chat_id, text)
                            
                            await session.flush()
                            stmt = select(NotificationRetry).where(NotificationRetry.chat_id == chat_id)
                            res = await session.execute(stmt)
                            item = res.scalars().first()
                            assert item is not None
                            # We don't assert last_error here because it might be cleared by fallback instantly
                            
                            await asyncio.sleep(0.5)
                            assert mock_send.called

    async def test_health_check_endpoint_logic(self, session: AsyncSession):
        """
        Logic: Verify health check flags Congested when > 10 items are stuck.
        """
        from datetime import UTC, datetime, timedelta

        from app.api.endpoints.health import notifications_health_check

        now = datetime.now(UTC).replace(tzinfo=None)
        for i in range(11):
            session.add(NotificationRetry(
                chat_id=str(i), text=f"Stuck {i}", status="pending", 
                created_at=now - timedelta(minutes=15)
            ))
        session.add(NotificationRetry(chat_id="99", text="Error", status="failed", last_error="Sim Error"))
        await session.commit()

        health = await notifications_health_check(session=session)
        assert health["counts"]["pending"] >= 11
        assert health["stuck_pending_10m"] >= 11
        assert health["status"] == "congested"

    async def test_deduplication_conflict(self, session: AsyncSession):
        """
        Conflict: Dedup prevents rapid identical messages.
        """
        chat_id = "555"
        text = "Dedup conflict test"
        
        with patch("app.services.notification_service.send_telegram_task.kiq", new_callable=AsyncMock) as mock_kiq:
            with patch("app.services.rate_limit_service.rate_limit_service.is_duplicate") as mock_dup:
                with patch("app.services.rate_limit_service.rate_limit_service.is_blocked", return_value=False):
                    mock_dup.side_effect = [False, True]
                    
                    await notification_service.send_standard(chat_id, text)
                    await notification_service.send_standard(chat_id, text)
                    
                    assert mock_kiq.call_count == 1

    async def test_double_send_bug_in_fallback(self, session: AsyncSession):
        """
        Broken Logic Detection: Verify if fallback send leaves a 'pending' item in DB 
        that would cause the scheduler to send it a second time.
        """
        chat_id = "99999"
        text = "Fallback bug test"

        with patch("app.services.notification_service.send_telegram_task.kiq", side_effect=Exception("Broker Dead")):
            with patch("bot.bot.send_message", new_callable=AsyncMock):
                with patch("app.services.rate_limit_service.rate_limit_service.is_duplicate", return_value=False):
                    with patch("app.services.rate_limit_service.rate_limit_service.is_blocked", return_value=False):
                        
                        await notification_service.enqueue_notification(chat_id, text)
                        
                        # Wait for background fallback task
                        await asyncio.sleep(0.5)
                        
                        # Check DB
                        stmt = select(NotificationRetry).where(NotificationRetry.chat_id == chat_id)
                        res = await session.execute(stmt)
                        item = res.scalars().first()
                        
                        assert item is not None
                        assert item.status == "sent", f"BUG FOUND: Item status is {item.status}, expected 'sent' to prevent double send!"

    async def test_markdown_parse_failure_handling(self, session: AsyncSession):
        """
        Broken Logic: Verify system handles Telegram API errors (like bad Markdown) 
        by marking as pending/failed with error details.
        """
        chat_id = "444"
        text = "Bad [Markdown" 
        
        from aiogram.exceptions import TelegramBadRequest
        with patch("bot.bot.send_message", side_effect=TelegramBadRequest(method=MagicMock(), message="can't parse entities")):
            with patch("app.services.rate_limit_service.rate_limit_service.is_allowed", return_value=True):
                from app.services.notification_service import (
                    NotificationPayload,
                    send_telegram_task,
                )
                payload = NotificationPayload(chat_id=chat_id, text=text, priority="medium")
                
                # Create the retry record manually since we are skipping enqueue_notification and calling worker task directly
                from app.models.notification_retry import NotificationRetry
                retry_item = NotificationRetry(chat_id=chat_id, text=text, status="pending")
                session.add(retry_item)
                await session.commit()

                await send_telegram_task(payload.model_dump())
                
                # Clear session cache to see updates made by a different session in the worker
                session.expire_all()
                
                stmt = select(NotificationRetry).where(NotificationRetry.chat_id == chat_id)
                res = await session.execute(stmt)
                item = res.scalars().first()
                
                assert item is not None
                assert item.status == "pending"
                assert "parse entities" in item.last_error

    async def test_user_blocked_detection(self, session: AsyncSession):
        """
        Critical Flow: Detect and handle user blocking the bot.
        """
        from aiogram.exceptions import TelegramForbiddenError

        from app.models.partner import Partner
        
        chat_id = "12345"
        partner = Partner(telegram_id=str(chat_id), referral_code="TESTBLOCK", username="blocked_user")
        session.add(partner)
        await session.commit()
        
        # 1. Simulate a send that fails with Forbidden (User blocked Bot)
        with patch("bot.bot.send_message", side_effect=TelegramForbiddenError(method=MagicMock(), message="forbidden")):
            # Mock rate_limit_service to avoid redis and set dummy state
            with patch("app.services.rate_limit_service.rate_limit_service.is_allowed", return_value=True):
                with patch("app.services.rate_limit_service.rate_limit_service.mark_user_blocked", new_callable=AsyncMock) as mock_mark:
                    
                    from app.services.notification_service import NotificationPayload
                    payload = NotificationPayload(chat_id=chat_id, text="Hello", priority="medium")
                    await send_telegram_task(payload.model_dump())
                    
                    # 2. Verify Partner updated in DB
                    await session.refresh(partner)
                    assert partner.notifications_paused is True
                    mock_mark.assert_called_once_with(chat_id)

                    # 3. Verify subsequent enqueue is skipped
                    with patch("app.services.rate_limit_service.rate_limit_service.is_blocked", return_value=True):
                        with patch("app.services.notification_service.send_telegram_task.kiq", new_callable=AsyncMock) as mock_kiq:
                            await notification_service.enqueue_notification(chat_id, "Silent skip")
                            assert mock_kiq.call_count == 0

    async def test_notification_resume_on_engagement(self, session: AsyncSession):
        """
        Flow: Notifications should resume when user sends /start or interacts.
        """
        from app.models.partner import Partner
        from bot import cmd_start
        
        chat_id = "67890"
        # Start as paused
        partner = Partner(
            telegram_id=str(chat_id), 
            referral_code="RESUME_ME", 
            notifications_paused=True
        )
        session.add(partner)
        await session.commit()
        
        # Mock message for /start
        mock_msg = MagicMock()
        mock_msg.from_user.id = chat_id
        mock_msg.from_user.username = "resumer"
        mock_msg.from_user.first_name = "Test"
        mock_msg.from_user.last_name = "User"
        mock_msg.from_user.language_code = "en"
        mock_msg.text = "/start"
        mock_msg.answer = AsyncMock()
        mock_state = AsyncMock()

        async def get_test_session():
            yield session
        
        with patch("bot.bot.get_me", new_callable=AsyncMock) as mock_get_me:
            mock_get_me.return_value.username = "test_bot"
            with patch("app.services.partner_service.create_partner", return_value=(partner, False)):
                with patch("app.services.rate_limit_service.rate_limit_service.unmark_user_blocked", new_callable=AsyncMock) as mock_unmark:
                    with patch("bot.get_session", new=get_test_session):
                        await cmd_start(mock_msg, mock_state)
                        
                        # Verify DB updated
                        await session.refresh(partner)
                        assert partner.notifications_paused is False
                        mock_unmark.assert_called_once_with(int(chat_id))
