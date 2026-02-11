import json

import redis.asyncio as redis

from app.core.config import settings


import logging

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        # Default client for text/JSON operations
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        # Raw client for binary operations (Photos, etc.)
        self.raw_client = redis.from_url(settings.REDIS_URL, decode_responses=False)

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

        :param key: Redis key
        :param factory: Async function (call) that returns the data
        :param expire: Expiration time in seconds
        """
        try:
            cached = await self.get_json(key)
            if cached is not None:
                logger.debug(f"Cache HIT: {key}")
                return cached
        except Exception as e:
            logger.error(f"❌ Cache Read Error for {key}: {e}")

        # Compute
        data = await factory()

        # Cache even if empty (e.g. empty list/dict), but not if None
        if data is not None:
            try:
                await self.set_json(key, data, expire=expire)
                logger.info(f"Cache Refresh: {key} (TTL: {expire}s)")
            except Exception as e:
                logger.error(f"❌ Cache Write Error for {key}: {e}")

        return data

redis_service = RedisService()
