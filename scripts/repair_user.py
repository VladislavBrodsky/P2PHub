
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.rate_limit_service import rate_limit_service
from app.services.redis_service import redis_service

async def repair_user(telegram_id, internal_id=None):
    # 1. Unblock in rate limit
    await rate_limit_service.unmark_user_blocked(int(telegram_id))
    print(f"✅ Unmarked {telegram_id} as blocked in Redis.")
    
    # 2. Clear all rate limit keys for this user
    redis = await rate_limit_service.get_redis()
    await redis.delete(f"rate_limit:user:{telegram_id}")
    
    # 3. Clear duplicate keys (aggressive)
    keys = await redis.keys(f"notif_dup:{telegram_id}:*")
    if keys:
        await redis.delete(*keys)
        print(f"✅ Cleared {len(keys)} duplicate prevention keys.")
    
    # 4. Clear Profile caches
    if internal_id:
        await redis.delete(f"partner:profile:{telegram_id}")
        await redis.delete(f"profile_cache_v3:{internal_id}")
        await redis.delete(f"partner:earnings:{telegram_id}")
        print(f"✅ Cleared profile & earnings cache for Partner ID {internal_id}.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 repair_user.py <telegram_id> [internal_id]")
    else:
        tid = sys.argv[1]
        iid = sys.argv[2] if len(sys.argv) > 2 else None
        asyncio.run(repair_user(tid, iid))
