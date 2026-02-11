
import asyncio
import os
import sys

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.redis_service import redis_service


async def clear_leaderboard_cache():
    # Scan for leaderboard keys
    keys = await redis_service.client.keys("leaderboard:*")
    if keys:
        for k in keys:
            # redis_service wrapper might need raw client calls or similar
            # bytes to str if needed
            k_str = k.decode('utf-8') if isinstance(k, bytes) else k
            res = await redis_service.client.delete(k_str)
            print(f"🧹 Deleted {k_str}: {res}")
    else:
        print("No leaderboard keys found in Redis.")

    # Also clear partner profile caches to be safe
    profile_keys = await redis_service.client.keys("partner:profile:*")
    if profile_keys:
        for k in profile_keys:
            k_str = k.decode('utf-8') if isinstance(k, bytes) else k
            await redis_service.client.delete(k_str)
            print(f"🧹 Deleted {k_str}")

if __name__ == "__main__":
    asyncio.run(clear_leaderboard_cache())
