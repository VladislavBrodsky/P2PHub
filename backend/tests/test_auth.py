import time
import hashlib
import hmac
import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.api.endpoints.auth import (
    TelegramWidgetAuthPayload,
    validate_widget_auth,
    generate_signed_init_data,
    telegram_widget_auth,
)

def compute_test_widget_hash(payload_dict: dict, bot_token: str) -> str:
    # Construct check string
    vals = {k: str(v) for k, v in payload_dict.items() if v is not None and k != "hash"}
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    return hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

def test_validate_widget_auth_success():
    auth_date = int(time.time())
    payload_dict = {
        "id": 123456789,
        "first_name": "John",
        "last_name": "Doe",
        "username": "johndoe",
        "photo_url": "http://example.com/photo.jpg",
        "auth_date": auth_date,
    }
    widget_hash = compute_test_widget_hash(payload_dict, settings.BOT_TOKEN)
    
    payload = TelegramWidgetAuthPayload(**payload_dict, hash=widget_hash)
    assert validate_widget_auth(payload) is True

def test_validate_widget_auth_expired():
    # auth_date is older than 24 hours (86400 seconds)
    auth_date = int(time.time()) - 90000
    payload_dict = {
        "id": 123456789,
        "first_name": "John",
        "last_name": None,
        "username": "johndoe",
        "photo_url": None,
        "auth_date": auth_date,
    }
    widget_hash = compute_test_widget_hash(payload_dict, settings.BOT_TOKEN)
    
    payload = TelegramWidgetAuthPayload(**payload_dict, hash=widget_hash)
    # Verification should fail because auth_date is too old
    assert validate_widget_auth(payload) is False

def test_validate_widget_auth_bad_hash():
    auth_date = int(time.time())
    payload_dict = {
        "id": 123456789,
        "first_name": "John",
        "last_name": None,
        "username": "johndoe",
        "photo_url": None,
        "auth_date": auth_date,
    }
    payload = TelegramWidgetAuthPayload(**payload_dict, hash="invalid_hash_here_123")
    assert validate_widget_auth(payload) is False

def test_generate_signed_init_data():
    telegram_id = 987654321
    first_name = "Jane"
    last_name = "Smith"
    username = "janesmith"
    photo_url = "http://example.com/jane.jpg"
    
    init_data = generate_signed_init_data(
        telegram_id=telegram_id,
        first_name=first_name,
        last_name=last_name,
        username=username,
        photo_url=photo_url
    )
    
    # Check that it contains the expected keys in query string format
    assert f"auth_date=" in init_data
    assert f"query_id=" in init_data
    assert f"hash=" in init_data
    assert f"user=" in init_data

@pytest.mark.asyncio
async def test_telegram_widget_auth_endpoint(session: AsyncSession):
    from datetime import datetime, UTC, timedelta
    from app.services.partner_service import get_partner_by_telegram_id
    
    auth_date = int(time.time())
    payload_dict = {
        "id": 55555555,
        "first_name": "Test",
        "last_name": "User",
        "username": "testuser",
        "photo_url": None,
        "auth_date": auth_date,
    }
    widget_hash = compute_test_widget_hash(payload_dict, settings.BOT_TOKEN)
    payload = TelegramWidgetAuthPayload(**payload_dict, hash=widget_hash)
    
    # Execute the endpoint directly
    res = await telegram_widget_auth(payload=payload, session=session)
    
    assert res["status"] == "success"
    assert "initDataRaw" in res
    assert res["is_new"] is True
    
    # Age the created_at timestamp in the database to bypass the 10-second heuristic
    partner = await get_partner_by_telegram_id(session, str(payload.id))
    assert partner is not None
    partner.created_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=20)
    session.add(partner)
    await session.commit()
    
    # Run again - should not be "is_new" since the partner already exists
    res_again = await telegram_widget_auth(payload=payload, session=session)
    assert res_again["status"] == "success"
    assert res_again["is_new"] is False

@pytest.mark.asyncio
async def test_desktop_auth_full_integration_loop(session: AsyncSession):
    import json
    from app.core.security import validate_telegram_data
    
    auth_date = int(time.time())
    payload_dict = {
        "id": 77777777,
        "first_name": "Desktop",
        "last_name": "User",
        "username": "desktopuser",
        "photo_url": "http://photo.com/img.jpg",
        "auth_date": auth_date,
    }
    widget_hash = compute_test_widget_hash(payload_dict, settings.BOT_TOKEN)
    payload = TelegramWidgetAuthPayload(**payload_dict, hash=widget_hash)
    
    # 1. Authorize via widget endpoint
    res = await telegram_widget_auth(payload=payload, session=session)
    assert res["status"] == "success"
    assert "initDataRaw" in res
    
    init_data_raw = res["initDataRaw"]
    
    # 2. Verify the returned initDataRaw using the security middleware validation
    validated_vals = validate_telegram_data(init_data_raw)
    assert validated_vals is not None
    assert "user" in validated_vals
    
    # 3. Parse user and verify matches
    user_info = json.loads(validated_vals["user"])
    assert user_info["id"] == 77777777
    assert user_info["username"] == "desktopuser"
    assert user_info["first_name"] == "Desktop"
    assert user_info["last_name"] == "User"
    assert user_info["photo_url"] == "http://photo.com/img.jpg"
