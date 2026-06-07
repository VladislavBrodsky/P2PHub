import asyncio
import os
import sys
import json

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.core.config import settings
from app.services.redis_service import redis_service

async def check_redis_cache():
    # Force loading settings
    print(f"REDIS_URL: {settings.REDIS_URL}")
    
    
    tg_id = "716720099" # Telegram ID of @uslincoln
    cache_key = f"partner:profile:v7:{tg_id}"
    
    cached_val = await redis_service.client.get(cache_key)
    if not cached_val:
        print(f"❌ Key '{cache_key}' not found in Redis!")
        return
        
    print(f"✅ Key '{cache_key}' found!")
    data = json.loads(cached_val)
    print(f"Username: {data.get('username')}")
    print(f"Is Pro: {data.get('is_pro')}")
    print(f"Subscription Plan: {data.get('subscription_plan')}")
    print(f"Pro Tokens: {data.get('pro_tokens')}")

if __name__ == "__main__":
    asyncio.run(check_redis_cache())
