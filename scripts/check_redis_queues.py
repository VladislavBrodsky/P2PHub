
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.redis_service import redis_service
from app.core.config import settings

async def check_redis_queues():
    r = redis_service.client
    keys = await r.keys("*")
    print(f"Total keys in Redis: {len(keys)}")
    
    # TaskIQ typically uses 'taskiq:list:...' or simply the queue name
    # Let's search for lists
    for k in keys:
        try:
            k_type = await r.type(k)
            if k_type == "list":
                length = await r.llen(k)
                print(f"📋 List '{k}': {length} items")
        except Exception:
            pass

if __name__ == "__main__":
    asyncio.run(check_redis_queues())
