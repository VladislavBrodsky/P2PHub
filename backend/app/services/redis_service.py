import json
import redis.asyncio as redis
from app.core.config import settings

class RedisService:
    def __init__(self):
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def get(self, key: str):
        return await self.client.get(key)

    async def set(self, key: str, value: str, expire: int = None):
        await self.client.set(key, value, ex=expire)

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

redis_service = RedisService()
