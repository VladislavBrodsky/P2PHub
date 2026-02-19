import asyncio
import time
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RateLimitService:
    """
    High-performance Redis-backed Rate Limiter for Telegram Bot API.
    Handles global bot limits and per-user spam protection.
    """
    
    def __init__(self):
        # Telegram Limits (standard bots)
        self.GLOBAL_LIMIT_PER_SEC = 30 
        self.USER_LIMIT_PER_SEC = 1
        
        self._redis = None

    async def get_redis(self):
        if not self._redis:
            from redis.asyncio import from_url
            self._redis = await from_url(settings.REDIS_URL, decode_responses=True)
        return self._redis

    async def is_allowed(self, chat_id: int, priority: str = "medium") -> bool:
        """
        Checks if we can send a message right now.
        Implements a sliding window check.
        """
        # Critical bypass - always allow (but still throttle slightly to avoid 429)
        if priority == "high":
            return True

        redis = await self.get_redis()
        now = time.time()
        
        # 1. Global limit check (30 msg/sec)
        global_key = "rate_limit:global"
        async with redis.pipeline(transaction=True) as pipe:
            pipe.zremrangebyscore(global_key, 0, now - 1)
            pipe.zcard(global_key)
            pipe.zadd(global_key, {str(now): now})
            pipe.expire(global_key, 2)
            results = await pipe.execute()
            
        global_count = results[1]
        if global_count >= self.GLOBAL_LIMIT_PER_SEC:
            return False

        # 2. Per-user limit check (1 msg/sec)
        user_key = f"rate_limit:user:{chat_id}"
        async with redis.pipeline(transaction=True) as pipe:
            pipe.zremrangebyscore(user_key, 0, now - 1)
            pipe.zcard(user_key)
            pipe.zadd(user_key, {str(now): now})
            pipe.expire(user_key, 2)
            results = await pipe.execute()
            
        user_count = results[1]
        if user_count >= self.USER_LIMIT_PER_SEC:
            return False

        return True

    async def wait_for_slot(self, chat_id: int, priority: str = "medium", timeout: int = 30):
        """
        Active waiting for high-priority items or mission-critical tasks.
        """
        start = time.time()
        while time.time() - start < timeout:
            if await self.is_allowed(chat_id, priority):
                return True
            # Backoff based on priority
            await asyncio.sleep(0.1 if priority == "high" else 0.5)
        return False

    async def is_duplicate(self, chat_id: int, text: str, salt: str = "") -> bool:
        """
        Prevents identical messages to the same user within a short window (60s).
        Crucial for preventing bot-spam during high-concurrency referral bursts.
        """
        import hashlib
        redis = await self.get_redis()
        
        # Create a light hash of the message content
        content_hash = hashlib.md5(f"{text}{salt}".encode()).hexdigest()
        dup_key = f"notif_dup:{chat_id}:{content_hash}"
        
        # Attempt to set the key, if it exists (set=False), it's a duplicate
        is_new = await redis.set(dup_key, "1", ex=60, nx=True)
        return not is_new

rate_limit_service = RateLimitService()
