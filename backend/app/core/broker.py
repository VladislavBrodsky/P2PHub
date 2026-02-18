from taskiq_redis import ListQueueBroker, RedisAsyncResultBackend

from app.core.config import settings

# 1. Init Broker (Redis)
broker = ListQueueBroker(
    url=settings.REDIS_URL,
)

# 2. Init Result Backend
result_backend = RedisAsyncResultBackend(
    redis_url=settings.REDIS_URL,
)
broker.with_result_backend(result_backend)
