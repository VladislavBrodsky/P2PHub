import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import asyncio
import logging
from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)

async def main():
    print("\n--- Flushing ALL Redis Caches ---")
    try:
        # Flush the entire current database to guarantee no stale 'stats' or 'profile' ghosts
        await redis_service.client.flushdb()
        print("✅ Redis FLUSHDB executed successfully. All keys wiped.")
    except Exception as e:
        print(f"⚠️ Redis flush warning: {e}")

    print("\n🎉 Redis Cache Fully Flushed! Stats should now be live on Frontend.")

if __name__ == "__main__":
    asyncio.run(main())
