import asyncio
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.redis_service import redis_service

async def clear_profile_cache():
    print("🧹 Starting global profile cache clear...")
    
    # We clear ALL versions to be absolutely sure
    patterns = [
        "partner:profile:*",
        "partner:profile:v5:*",
        "partner:profile:v4:*",
        "profile_cache_v3:*"
    ]
    
    for pattern in patterns:
        print(f"Checking pattern: {pattern}")
        count = 0
        async for key in redis_service.client.scan_iter(match=pattern):
            await redis_service.client.delete(key)
            count += 1
        print(f"✅ Deleted {count} keys for pattern '{pattern}'")

    print("\n✨ Global profile cache clear complete!")

if __name__ == "__main__":
    asyncio.run(clear_profile_cache())
