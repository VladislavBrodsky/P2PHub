import json

import redis.asyncio as redis

from app.core.config import settings


import logging

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        # #comment: Implementing connection pooling to handle high-concurrency across Gunicorn workers.
        # max_connections=20 per worker (80 total) allows headroom for traffic spikes.
        # socket_keepalive ensures idle connections aren't dropped by cloud firewalls.
        pool_args = {
            "max_connections": 20,
            "socket_timeout": 5.0,
            "socket_keepalive": True,
            "retry_on_timeout": True,
            "decode_responses": True
        }
        self.client = redis.from_url(settings.REDIS_URL, **pool_args)
        
        # Raw client for binary operations (Photos, etc.)
        raw_pool_args = pool_args.copy()
        raw_pool_args["decode_responses"] = False
        self.raw_client = redis.from_url(settings.REDIS_URL, **raw_pool_args)

    async def get(self, key: str):
        return await self.client.get(key)

    async def set(self, key: str, value: str, expire: int = None):
        await self.client.set(key, value, ex=expire)

    async def get_bytes(self, key: str):
        return await self.raw_client.get(key)

    async def set_bytes(self, key: str, value: bytes, expire: int = None):
        await self.raw_client.set(key, value, ex=expire)

    async def get_json(self, key: str):
        data = await self.get(key)
        return json.loads(data) if data else None

    async def set_json(self, key: str, value: any, expire: int = 300):
        await self.set(key, json.dumps(value), expire=expire)

    # Leaderboard / Sorted Set Methods
    async def zincrby(self, name: str, amount: float, value: str):
        await self.client.zincrby(name, amount, value)

    async def zrevrange(self, name: str, start: int, end: int, withscores: bool = True):
        return await self.client.zrevrange(name, start, end, withscores=withscores)

    async def zscore(self, name: str, value: str):
        return await self.client.zscore(name, value)

    async def zrevrank(self, name: str, value: str):
        return await self.client.zrevrank(name, value)

    # Queue Operations
    async def lpush(self, name: str, value: str):
        await self.client.lpush(name, value)

    async def brpop(self, name: str, timeout: int = 0):
        # Returns (key, value) tuple or None
        return await self.client.brpop(name, timeout=timeout)

    async def get_or_compute(self, key: str, factory, expire: int = 300):
        """
        Tries to get data from cache. If missing, awaits the factory function,
        caches the result, and returns it.
        """
        try:
            cached = await self.get_json(key)
            if cached is not None:
                return cached
        except Exception as e:
            logger.error(f"❌ Cache Read Error for {key}: {e}")

        # Compute
        data = await factory()

        if data is not None:
            try:
                # #comment: Using "Jitter" (±10% random TTL) to prevent the "Thundering Herd" effect.
                # If 10,000 users have the same 5-minute expiry, they would all hit the DB at once.
                import random
                jitter = random.randint(-max(1, int(expire * 0.1)), max(1, int(expire * 0.1)))
                final_expire = max(1, expire + jitter)
                
                await self.set_json(key, data, expire=final_expire)
                logger.info(f"Cache Refresh: {key} (TTL: {final_expire}s with jitter)")
            except Exception as e:
                logger.error(f"❌ Cache Write Error for {key}: {e}")

        return data

redis_service = RedisService()
