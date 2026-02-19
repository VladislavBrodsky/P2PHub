
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner
from app.services.notification_service import notification_service
from app.core.config import settings
from app.core.i18n import get_msg

@pytest.mark.asyncio
async def test_uslincoln_localization(session: AsyncSession):
    """
    Test ensuring that account @uslincoln with Russian language receives Russian notifications.
    """
    # Restore the REAL method (bypassing conftest.py's autouse mock)
    from app.services.notification_service import NotificationService, send_telegram_task
    real_send_level = NotificationService.send_level_up_notification
    real_send_standard = NotificationService.send_standard
    real_enqueue = NotificationService.enqueue_notification
    
    # We need to bind the unstanced method to the instance
    notification_service.send_level_up_notification = real_send_level.__get__(notification_service, NotificationService)
    notification_service.send_standard = real_send_standard.__get__(notification_service, NotificationService)
    notification_service.enqueue_notification = real_enqueue.__get__(notification_service, NotificationService)

    # 1. Create the user @uslincoln
    import secrets
    partner = Partner(
        telegram_id="999999",
        username="uslincoln",
        first_name="Lincoln",
        language_code="ru",
        referral_code=secrets.token_hex(4),
        referrer_id=None,
        status="active"
    )
    session.add(partner)
    await session.commit()
    await session.refresh(partner)

    # 2. Mock the send_telegram_task.kiq to capture payload
    # We need to patch it where it is imported or used. It is used as send_telegram_task.kiq
    
    # Use MagicMock for kiq because it might need to be awaitable or not depending on taskiq version, 
    # but usually kiq is async.
    with patch("app.services.notification_service.send_telegram_task.kiq", new_callable=AsyncMock) as mock_kiq:
        
        # We also need to mock rate_limit_service because enqueue checks it
        with patch("app.services.notification_service.rate_limit_service.is_duplicate", new_callable=AsyncMock) as mock_dedup:
            mock_dedup.return_value = False
            
            # 3. Trigger a level up notification (which uses get_msg)
            # Level 1 -> 2
            await notification_service.send_level_up_notification(
                chat_id=int(partner.telegram_id),
                old_level=1,
                new_level=2,
                lang=partner.language_code
            )
            
            # 4. Verify the message content passed to kiq
            assert mock_kiq.call_count == 1
            args, kwargs = mock_kiq.call_args
            payload = args[0] # send_telegram_task.kiq(payload.model_dump())
            
            sent_text = payload.get("text", "")
            
            # Fetch expected Russian text
            expected_text = get_msg("ru", "level_up", level=2)
            
            # Verify it matches
            assert sent_text == expected_text
            assert "Новый Уровень!" in sent_text
            assert "You've reached" not in sent_text

    # 5. Test Referral Notification (Standard message)
    # We need to verify get_msg is working for other keys
    msg = get_msg("ru", "btn_view_network")
    assert msg == "📊 Моя Сеть"
    
    print("✅ Localization test for @uslincoln passed (RU confirmed).")
