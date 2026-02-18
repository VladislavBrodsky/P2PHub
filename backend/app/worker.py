
import taskiq_fastapi
from taskiq import TaskiqScheduler
from taskiq.schedule_sources import LabelScheduleSource
from taskiq_redis import ListQueueBroker, RedisAsyncResultBackend

from app.core.config import settings

from app.core.broker import broker


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

# 6. CRITICAL: Actually import all task modules so @broker.task decorators register.
# Previously TASKS_TO_IMPORT was a dead list — the worker started without knowing
# about any tasks, so ALL cron jobs and background tasks silently never ran.
# These imports MUST happen at module level so the worker process registers them.
import app.services.maintenance_service  # noqa: F401
import app.services.notification_service  # noqa: F401
import app.services.partner_service       # noqa: F401
import app.services.referral_service      # noqa: F401
import app.services.subscription_service  # noqa: F401
import app.services.support_service       # noqa: F401
import app.services.viral_service         # noqa: F401
import app.services.warmup_service        # noqa: F401
