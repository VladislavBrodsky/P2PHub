import sys
import os
import time
import json
import hashlib
import hmac
import urllib.parse
from sqlmodel import select

# Ensure backend folder is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.config import settings
from app.api.endpoints.auth import TelegramWidgetAuthPayload, validate_widget_auth, generate_signed_init_data
from app.core.security import validate_telegram_data

def compute_widget_hash(payload_dict: dict, bot_token: str) -> str:
    vals = {k: str(v) for k, v in payload_dict.items() if v is not None and k != "hash"}
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    return hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

async def main():
    print("🤖 STARTING CRYPTOGRAPHIC DESKTOP AUTHENTICATION AUDIT...")
    print(f"🔑 BOT_TOKEN loaded: {'Configured ✅' if settings.BOT_TOKEN else 'MISSING ❌'}")
    
    # --- STEP 1: Simulate Desktop Telegram Widget Login ---
    print("\n--- STEP 1: Simulating Telegram Login Widget Payload ---")
    auth_date = int(time.time())
    user_payload = {
        "id": 716720099, # uslincoln's Telegram ID
        "first_name": "Lincoln",
        "last_name": "President",
        "username": "uslincoln",
        "photo_url": "https://t.me/i/userpic/uslincoln.jpg",
        "auth_date": auth_date
    }
    
    # Cryptographically sign the payload as Telegram Widget would
    widget_hash = compute_widget_hash(user_payload, settings.BOT_TOKEN)
    user_payload["hash"] = widget_hash
    print(f"👉 Generated Widget Payload: {json.dumps(user_payload, indent=2)}")
    
    # --- STEP 2: Validate Widget Auth Hash ---
    print("\n--- STEP 2: Verifying Widget Signature on Backend ---")
    payload_obj = TelegramWidgetAuthPayload(**user_payload)
    is_valid = validate_widget_auth(payload_obj)
    
    if is_valid:
        print("✅ Widget Signature VERIFIED successfully!")
    else:
        print("❌ Widget Signature Verification FAILED!")
        return
        
    # --- STEP 3: Generate Signed Desktop Token (initDataRaw) ---
    print("\n--- STEP 3: Generating Signed Desktop TMA Session Token (initDataRaw) ---")
    init_data_raw = generate_signed_init_data(
        telegram_id=payload_obj.id,
        first_name=payload_obj.first_name,
        last_name=payload_obj.last_name,
        username=payload_obj.username,
        photo_url=payload_obj.photo_url
    )
    print(f"👉 Generated initDataRaw Token:\n{init_data_raw}")
    
    # --- STEP 4: Authenticate Endpoint Request Using the Token ---
    print("\n--- STEP 4: Simulating Authenticated API Request via get_current_user Dependency ---")
    try:
        validated_session = validate_telegram_data(init_data_raw)
        print("✅ Session Token Decrypted & Signature VERIFIED by Security Middleware!")
        print(f"👉 Recovered Session Data: {json.dumps(validated_session, indent=2)}")
        
        user_obj = json.loads(validated_session["user"])
        print("\n--- STEP 5: Integrity Verification ---")
        assert user_obj["id"] == 716720099, "User ID mismatch"
        assert user_obj["username"] == "uslincoln", "Username mismatch"
        assert user_obj["first_name"] == "Lincoln", "First name mismatch"
        assert user_obj["last_name"] == "President", "Last name mismatch"
        assert user_obj["photo_url"] == "https://t.me/i/userpic/uslincoln.jpg", "Photo URL mismatch"
        print("💎 ALL AUTH INTEGRITY CHECKS PASSED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"❌ Session Token validation failed: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
