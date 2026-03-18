import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import asyncio
import logging
from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)

async def main():
    print("\n--- Flushing Redis Cache ---")
    try:
        keys = await redis_service.client.keys("ref_tree_stats_v2:*")
        if keys:
            await redis_service.client.delete(*keys)
            print(f"✅ Flushed {len(keys)} tree stats cache keys.")
        else:
            print("✅ No tree stats cache keys found to flush.")

        keys_members = await redis_service.client.keys("ref_tree_members_v2:*")
        if keys_members:
            await redis_service.client.delete(*keys_members)
            print(f"✅ Flushed {len(keys_members)} tree members cache keys.")
        else:
            print("✅ No tree members cache keys found.")
            
        growth_keys = await redis_service.client.keys("growth_metrics:*")
        if growth_keys:
            await redis_service.client.delete(*growth_keys)
            print(f"✅ Flushed {len(growth_keys)} growth metric cache keys.")

    except Exception as e:
        print(f"⚠️ Redis flush warning: {e}")

    print("\n🎉 Redis Cache Flushed! Stats should now be live.")

if __name__ == "__main__":
    asyncio.run(main())
