import hashlib
import hmac
import json
import logging
import time
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


def validate_telegram_data(init_data: str) -> dict:
    try:
        if not init_data:
            # Not an error, just means we're in guest mode or outside TMA
            return {}

        vals = dict(parse_qsl(init_data))
        hash_str = vals.pop('hash', None)
        if not hash_str:
            logger.warning("[AUTH] Hash missing in initData")
            raise HTTPException(status_code=401, detail="Hash missing")

        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))

        # Proper HMAC verification using BOT_TOKEN as secret
        secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
        hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if hmac_hash != hash_str:
            logger.warning(f"[AUTH] Signature check failed. Expected: {str(hmac_hash)[:6]}... Received: {str(hash_str)[:6]}...")
            raise HTTPException(status_code=401, detail="Invalid signature")

        # Replay attack protection: auth_date must be within 30 days (extended from 7 days)
        # Why: Prevents 401 errors for users with long-running Telegram Mini App sessions.
        auth_date = int(vals.get('auth_date', 0))
        delta = time.time() - auth_date
        if delta > 2592000: # 30 days
            logger.warning(f"[AUTH] Session expired. auth_date: {auth_date} (Delta: {delta:.1f}s) InitData: {str(init_data)[:50]}...")
            raise HTTPException(status_code=401, detail="Session expired")

        # #comment: Log successful signature but warn on old sessions
        if delta > 86400:
            logger.info(f"[AUTH] Using aged session (Age: {delta/3600:.1f}h) for user {str(vals.get('user', 'unknown'))[:20]}...")

        return vals
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] Unexpected authentication error ({type(e).__name__}): {e}")
        # Log a snippet of the initData to help debug malformed data from frontend
        logger.debug(f"[AUTH] problematic initData: {str(init_data)[:100]}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def get_current_user(
    x_telegram_init_data: str | None = Header(None, alias="X-Telegram-Init-Data"),
    authorization: str | None = Header(None)
):
    """
    Central authentication dependency. Verified Telegram initData.
    Supports both X-Telegram-Init-Data and Authorization: Bearer <data>
    """
    init_data = x_telegram_init_data
    
    # Fallback to Authorization header if custom header is missing
    if not init_data and authorization and authorization.startswith("Bearer "):
        init_data = authorization.replace("Bearer ", "", 1)
        
    if not init_data:
        return None
    return validate_telegram_data(init_data)

def get_tg_user(user_data: dict) -> dict:
    """Helper to parse the 'user' JSON field from initData."""
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user_field = user_data.get("user")
    if not user_field:
        # If user is already at top level (supports some legacy or internal calls)
        if "id" in user_data:
            return user_data
        raise HTTPException(status_code=400, detail="User field missing in initData")
        
    try:
        if isinstance(user_field, str):
            return json.loads(user_field)
        return user_field
    except Exception as e:
        logger.error(f"Failed to parse user JSON: {e}")
        raise HTTPException(status_code=400, detail="Malformed user data")

async def get_current_admin(user_data: dict = Depends(get_current_user)):
    """
    Dependency to verify if the current user is an admin.
    """
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    if tg_id not in settings.ADMIN_USER_IDS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return tg_user
