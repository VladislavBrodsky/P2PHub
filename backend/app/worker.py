
import taskiq_fastapi
from taskiq import TaskiqScheduler
from taskiq.schedule_sources import LabelScheduleSource
from taskiq_redis import ListQueueBroker, RedisAsyncResultBackend

from app.core.config import settings

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

# 6. CRITICAL: Actually import all task modules so @broker.task decorators register.
# Previously TASKS_TO_IMPORT was a dead list — the worker started without knowing
# about any tasks, so ALL cron jobs and background tasks silently never ran.
# These imports MUST happen at module level so the worker process registers them.
import app.services.partner_service       # warm_up_partner_photos, handle_partner_creation_task, sync_profile_photos_task  # noqa: E402, F401
import app.services.notification_service  # send_telegram_task  # noqa: E402, F401
import app.services.subscription_service  # check_expiring_subscriptions_task  # noqa: E402, F401
import app.services.referral_service      # process_referral_logic  # noqa: E402, F401
import app.services.support_service       # cleanup_stale_support_sessions, warm_up_kb_task  # noqa: E402, F401
import app.services.maintenance_service   # refresh_admin_stats, process_notification_retries, reconcile_network_stats_task, cleanup_stale_transactions, cleanup_old_audit_logs, reset_monthly_pro_tokens, economy_integrity_audit_task  # noqa: E402, F401
import app.services.viral_service         # log_viral_generation_task, log_rss_to_sheets_task  # noqa: E402, F401
import app.services.warmup_service        # warmup_redis  # noqa: E402, F401
