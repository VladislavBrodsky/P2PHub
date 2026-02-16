
import taskiq_fastapi
from app.core.config import settings
from taskiq import TaskiqScheduler
from taskiq.schedule_sources import LabelScheduleSource
from taskiq_redis import ListQueueBroker, RedisAsyncResultBackend

# 1. Init Broker (Redis)
broker = ListQueueBroker(
    url=settings.REDIS_URL,
)

# 2. Init Result Backend (for checking task status if needed)
result_backend = RedisAsyncResultBackend(
    redis_url=settings.REDIS_URL,
)
broker.with_result_backend(result_backend)

# 3. Validation Middleware
# Note: TaskIQ 0.12+ handles Pydantic validation natively for type-hinted tasks.
# The separate PydanticMiddleware is no longer required or available in this version.
# broker.add_middlewares([]) 

# 4. Scheduler (for Cron jobs like daily stats reset)
scheduler = TaskiqScheduler(
    broker=broker,
    sources=[LabelScheduleSource(broker)],
)

# 5. FastAPI Integration
# This allows dependency injection in tasks (e.g. Depends(get_db))
taskiq_fastapi.init(
    broker,
    "app.main:app",
)

# 6. Define Tasks to be imported
# (This ensures the worker knows about them on startup)
TASKS_TO_IMPORT: list[str] = [
    "app.services.partner_service",
    "app.services.notification_service",
    "app.services.subscription_service",
    "app.services.referral_service",
    "app.services.analytics_service",
    "app.services.support_service",
    "app.services.maintenance_service",
]
