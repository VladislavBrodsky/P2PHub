import hmac
import hashlib
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
        
        secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
        hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if hmac_hash != hash_str:
            raise HTTPException(status_code=401, detail="Invalid hash")
            
        return vals
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

async def get_current_user(x_telegram_init_data: str = Header(...)):
    return validate_telegram_data(x_telegram_init_data)
