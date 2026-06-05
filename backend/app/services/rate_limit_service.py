import asyncio
import logging
import time

from app.core.config import settings

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
            from app.services.redis_service import redis_service
            self._redis = redis_service.client
        return self._redis

    async def is_allowed(self, chat_id: int | str, priority: str = "medium") -> bool:
        """
        Checks if we can send a message right now.
        Implements a sliding window check.
        """
        # Critical bypass - always allow (but still throttle slightly to avoid 429)
        if priority == "high":
            return True

        try:
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
            return not user_count >= self.USER_LIMIT_PER_SEC
        except Exception as e:
            logger.warning(f"Rate limit check failed (Redis error), allowing: {e}")
            return True

    async def wait_for_slot(self, chat_id: int, priority: str = "medium", timeout: int = 30):
        """
        Active waiting for high-priority items or mission-critical tasks.
        """
        start = time.time()
        while time.time() - start < timeout:
            try:
                if await self.is_allowed(chat_id, priority):
                    return True
            except Exception:
                return True # Fail open on system errors
            # Backoff based on priority
            await asyncio.sleep(0.1 if priority == "high" else 0.5)
        return False

    async def is_duplicate(self, chat_id: int | str, text: str, salt: str = "") -> bool:
        """
        Prevents identical messages to the same user within a short window (60s).
        Normalization ensures that messages with minor differences (emojis, formatting) 
        are correctly identified as duplicates.
        """
        import hashlib
        import re
        try:
            redis = await self.get_redis()
            
            # 1. Normalize text: remove emojis, punctuation, and extra whitespace to catch "similar" messages
            # We keep only alphanumeric characters and basic spaces for the hash
            normalized_text = re.sub(r'[^\w\s]', '', text)
            normalized_text = " ".join(normalized_text.split()).lower()
            
            # 2. Create a content hash (Salt allows distinguishing different *types* of messages)
            content_hash = hashlib.md5(f"{normalized_text}{salt}".encode()).hexdigest()
            dup_key = f"notif_dup:{chat_id}:{content_hash}"
            
            # Attempt to set the key, if it exists (set=False), it's a duplicate
            is_new = await redis.set(dup_key, "1", ex=60, nx=True)
            return not is_new
        except Exception as e:
            logger.warning(f"Duplicate check failed (Redis error), allowing: {e}")
            return False

    async def is_blocked(self, chat_id: int | str) -> bool:
        """Checks if a user has blocked the bot or has notifications paused (cached in Redis)."""
        try:
            redis = await self.get_redis()
            return await redis.exists(f"blocked_user:{chat_id}") > 0
        except Exception:
            return False # Assume not blocked if check fails

    async def mark_user_blocked(self, chat_id: int | str, duration: int = 86400):
        """Marks a user as blocked/paused in Redis (default 24h)."""
        try:
            redis = await self.get_redis()
            await redis.set(f"blocked_user:{chat_id}", "1", ex=duration)
        except Exception:
            pass

    async def unmark_user_blocked(self, chat_id: int | str):
        """Removes the blocked/paused status from Redis."""
        try:
            redis = await self.get_redis()
            await redis.delete(f"blocked_user:{chat_id}")
        except Exception:
            pass

    async def trip_circuit_breaker(self, duration: int):
        """
        Trips a global circuit breaker to pause all outgoing notifications 
        (except high priority) due to severe Telegram rate limiting.
        """
        try:
            redis = await self.get_redis()
            # We add a 2 second buffer to whatever Telegram told us to wait
            safe_duration = duration + 2
            await redis.set("circuit_breaker:telegram", "tripped", ex=safe_duration)
            logger.warning(f"🔌 CIRCUIT BREAKER TRIPPED for {safe_duration}s.")
        except Exception as e:
            logger.error(f"Failed to trip circuit breaker: {e}")

    async def is_circuit_breaker_tripped(self) -> bool:
        """Checks if the global Telegram notification circuit breaker is currently active."""
        try:
            redis = await self.get_redis()
            return await redis.exists("circuit_breaker:telegram") > 0
        except Exception:
            # If Redis fails, we generally want to fail open to keep the system running,
            return False

rate_limit_service = RateLimitService()
