import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.services.redis_service import redis_service

async def clear_cache():
    # Force use of redis v5 keys
    pattern = "partner:profile:v5:*"
    keys = await redis_service.client.keys(pattern)
    if keys:
        print(f"🗑️ Clearing {len(keys)} profile cache keys...")
        for k in keys:
            await redis_service.client.delete(k)
        print("✅ Cache cleared.")
    else:
        print("ℹ️ No profile cache keys found to clear.")

if __name__ == "__main__":
    asyncio.run(clear_cache())
