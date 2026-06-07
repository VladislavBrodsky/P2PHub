import asyncio
import os
import sys
import time
import json
import hmac
import hashlib
import urllib.parse
import httpx

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.core.config import settings

def generate_init_data(telegram_id: int, username: str, first_name: str, last_name: str) -> str:
    user_obj = {
        "id": telegram_id,
        "first_name": first_name,
        "last_name": last_name,
        "username": username,
        "language_code": "en",
        "allows_write_to_pm": True
    }
    
    params = {
        "auth_date": str(int(time.time())),
        "query_id": "AAEqcmoqAgAAAAJyaioN4yG7",
        "user": json.dumps(user_obj, separators=(',', ':'))
    }
    
    # Sort and construct data check string
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
    
    # Compute signature
    secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
    signature = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    # Construct raw query string
    params["hash"] = signature
    return urllib.parse.urlencode(params)

async def test_production_api():
    print(f"BOT_TOKEN: {settings.BOT_TOKEN[:10]}...{settings.BOT_TOKEN[-5:]}")
    
    init_data = generate_init_data(
        telegram_id=716720099,
        username="uslincoln",
        first_name="US",
        last_name="Lincoln"
    )
    
    url = "https://p2phub-production.up.railway.app/api/pro/status"
    headers = {
        "X-Telegram-Init-Data": init_data,
        "Accept": "application/json"
    }
    
    print(f"\nSending GET to {url}...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            print(f"Status Code: {response.status_code}")
            print("Response Headers:")
            for k, v in response.headers.items():
                print(f"  {k}: {v}")
            print("\nResponse Body:")
            print(response.text)
        except Exception as e:
            print(f"❌ HTTP Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_production_api())
