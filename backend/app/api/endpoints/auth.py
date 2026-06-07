import hashlib
import hmac
import json
import time
import urllib.parse
import secrets
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import get_session
from app.services.partner_service import create_partner
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])

class TelegramWidgetAuthPayload(BaseModel):
    id: int
    first_name: str
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str

def validate_widget_auth(payload: TelegramWidgetAuthPayload) -> bool:
    try:
        # Convert model to dict
        vals = payload.model_dump(exclude={"hash"})
        # Filter out None values
        vals = {k: str(v) for k, v in vals.items() if v is not None}
        
        # Sort and construct check string
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))
        
        # Calculate SHA256 of bot token (Login Widget secret)
        secret_key = hashlib.sha256(settings.BOT_TOKEN.encode()).digest()
        
        # Calculate HMAC SHA256 signature
        hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        # Verify signature
        if hmac_hash != payload.hash:
            logger.warning(f"[AUTH] Widget signature check failed. Expected: {hmac_hash[:6]}... Received: {payload.hash[:6]}...")
            return False
            
        # Replay attack protection (24 hours validity check for widget auth date)
        delta = time.time() - payload.auth_date
        if delta > 86400:
            logger.warning(f"[AUTH] Widget session expired. auth_date: {payload.auth_date} (Age: {delta:.1f}s)")
            return False
            
        return True
    except Exception as e:
        logger.error(f"[AUTH] Error in validate_widget_auth: {e}")
        return False

def generate_signed_init_data(telegram_id: int, first_name: str, last_name: str | None, username: str | None, photo_url: str | None) -> str:
    user_obj = {
        "id": telegram_id,
        "first_name": first_name or "",
        "last_name": last_name or "",
        "username": username or "",
        "language_code": "en"
    }
    if photo_url:
        user_obj["photo_url"] = photo_url

    vals = {
        "auth_date": str(int(time.time())),
        "query_id": f"desktop_auth_{secrets.token_hex(8)}",
        "user": json.dumps(user_obj, separators=(',', ':'))
    }
    
    # Sign exactly like standard TMA WebAppData
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))
    secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
    hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    vals["hash"] = hmac_hash
    return urllib.parse.urlencode(vals)

@router.post("/telegram-widget")
async def telegram_widget_auth(
    payload: TelegramWidgetAuthPayload,
    session: AsyncSession = Depends(get_session)
):
    """
    Validates a Telegram Login Widget authentication hash, registers or fetches the partner,
    and returns a cryptographically signed query string (initDataRaw) for desktop browser session storage.
    """
    # 1. Cryptographically validate the Telegram widget hash
    if not validate_widget_auth(payload):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication signature verification failed"
        )
    
    # 2. Get or create the partner user in DB
    lang = "en"
    partner, is_new = await create_partner(
        session=session,
        telegram_id=str(payload.id),
        username=payload.username,
        first_name=payload.first_name,
        last_name=payload.last_name,
        language_code=lang,
        referrer_code=None
    )
    
    # 3. Generate a valid signed initDataRaw for this user
    init_data_raw = generate_signed_init_data(
        telegram_id=payload.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        username=payload.username,
        photo_url=payload.photo_url
    )
    
    logger.info(f"🔑 Desktop user {payload.id} successfully authenticated via Telegram widget.")
    
    return {
        "status": "success",
        "initDataRaw": init_data_raw,
        "is_new": is_new,
        "partner_id": partner.id
    }
