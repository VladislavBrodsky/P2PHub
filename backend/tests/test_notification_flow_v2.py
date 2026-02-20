import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.services.notification_service import NotificationService, notification_service, send_telegram_task
from app.models.notification_retry import NotificationRetry
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
        chat_id = 999123
        text = "Batch test message"
        
        with patch("app.services.notification_service.send_telegram_task.kiq", new_callable=AsyncMock) as mock_kiq:
            with patch("app.services.rate_limit_service.rate_limit_service.is_duplicate", return_value=False):
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
            chat_id=888, text="Retry Me", status="pending", attempts=0
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
        chat_id = 7771
        text = "Emergency fallback test"

        with patch("app.services.notification_service.send_telegram_task.kiq", side_effect=Exception("Redis Down")):
            with patch("bot.bot.send_message", new_callable=AsyncMock) as mock_send:
                with patch("app.services.audit_service.audit_service.log_event", new_callable=AsyncMock) as mock_audit:
                    with patch("app.services.rate_limit_service.rate_limit_service.is_duplicate", return_value=False):
                        await notification_service.enqueue_notification(chat_id, text)
                        
                        await session.flush()
                        stmt = select(NotificationRetry).where(NotificationRetry.chat_id == chat_id)
                        res = await session.execute(stmt)
                        item = res.scalars().first()
                        assert item is not None
                        assert "Queue Error" in item.last_error
                        
                        await asyncio.sleep(0.5)
                        assert mock_send.called

    async def test_health_check_endpoint_logic(self, session: AsyncSession):
        """
        Logic: Verify health check flags Congested when > 10 items are stuck.
        """
        from app.api.endpoints.health import notifications_health_check
        from datetime import datetime, UTC, timedelta

        now = datetime.now(UTC).replace(tzinfo=None)
        for i in range(11):
            session.add(NotificationRetry(
                chat_id=i, text=f"Stuck {i}", status="pending", 
                created_at=now - timedelta(minutes=15)
            ))
        session.add(NotificationRetry(chat_id=99, text="Error", status="failed", last_error="Sim Error"))
        await session.commit()

        health = await notifications_health_check(session=session)
        assert health["counts"]["pending"] >= 11
        assert health["stuck_pending_10m"] >= 11
        assert health["status"] == "congested"

    async def test_deduplication_conflict(self, session: AsyncSession):
        """
        Conflict: Dedup prevents rapid identical messages.
        """
        chat_id = 555
        text = "Dedup conflict test"
        
        with patch("app.services.notification_service.send_telegram_task.kiq", new_callable=AsyncMock) as mock_kiq:
            with patch("app.services.rate_limit_service.rate_limit_service.is_duplicate") as mock_dup:
                mock_dup.side_effect = [False, True]
                
                await notification_service.send_standard(chat_id, text)
                await notification_service.send_standard(chat_id, text)
                
                assert mock_kiq.call_count == 1

    async def test_double_send_bug_in_fallback(self, session: AsyncSession):
        """
        Broken Logic Detection: Verify if fallback send leaves a 'pending' item in DB 
        that would cause the scheduler to send it a second time.
        """
        chat_id = 99999
        text = "Fallback bug test"

        with patch("app.services.notification_service.send_telegram_task.kiq", side_effect=Exception("Broker Dead")):
            with patch("bot.bot.send_message", new_callable=AsyncMock) as mock_send:
                with patch("app.services.rate_limit_service.rate_limit_service.is_duplicate", return_value=False):
                    
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
        chat_id = 444
        text = "Bad [Markdown" 
        
        from aiogram.exceptions import TelegramBadRequest
        with patch("bot.bot.send_message", side_effect=TelegramBadRequest(method=MagicMock(), message="can't parse entities")):
            with patch("app.services.rate_limit_service.rate_limit_service.is_allowed", return_value=True):
                from app.services.notification_service import NotificationPayload
                payload = NotificationPayload(chat_id=chat_id, text=text, priority="medium")
                
                from app.services.notification_service import send_telegram_task
                await send_telegram_task(payload.model_dump())
                
                stmt = select(NotificationRetry).where(NotificationRetry.chat_id == chat_id)
                res = await session.execute(stmt)
                item = res.scalars().first()
                
                assert item is not None
                assert item.status == "pending"
                assert "parse entities" in item.last_error
