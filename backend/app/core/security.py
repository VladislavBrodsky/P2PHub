import hmac
import hashlib
import json
from urllib.parse import parse_qsl
from fastapi import HTTPException, Header, Depends
from app.core.config import settings

def validate_telegram_data(init_data: str) -> dict:
    try:
        if not init_data:
            raise HTTPException(status_code=401, detail="Init data missing")
            
        vals = dict(parse_qsl(init_data))
        hash_str = vals.pop('hash', None)
        if not hash_str:
            raise HTTPException(status_code=401, detail="Hash missing")
            
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))
        
        # Proper HMAC verification using BOT_TOKEN as secret
        secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
        hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if hmac_hash != hash_str:
            raise HTTPException(status_code=401, detail="Invalid signature")
            
        # Replay attack protection: auth_date must be within 24h
        import time
        auth_date = int(vals.get('auth_date', 0))
        if time.time() - auth_date > 86400:
            raise HTTPException(status_code=401, detail="Session expired")
            
        return vals
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

async def get_current_user(x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data")):
    """
    Central authentication dependency. Verified Telegram initData.
    Returns None if header is missing, allowing guest mode.
    """
    if not x_telegram_init_data:
        return None
    return validate_telegram_data(x_telegram_init_data)

def get_tg_user(user_data: dict) -> dict:
    """Helper to parse the 'user' JSON field from initData."""
    try:
        user_json = user_data.get("user")
        if not user_json:
            raise ValueError("User field missing")
        return json.loads(user_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed user data")
