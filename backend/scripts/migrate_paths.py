import asyncio
import os
import sys

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Hardcode production DB URL to avoid local env issues
os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY")

# MOCK BOT & AIOGRAM & TASKIQ
import sys
from unittest.mock import MagicMock

# Bot Mocks
sys.modules["aiogram"] = MagicMock()
sys.modules["aiogram.client.bot"] = MagicMock()
sys.modules["bot"] = MagicMock()
sys.modules["bot"].bot = MagicMock()

# TaskIQ Mocks
def mock_task_decorator(*args, **kwargs):
    def decorator(func):
        return func
    return decorator

taskiq_mock = MagicMock()
taskiq_mock.TaskiqScheduler = MagicMock()
sys.modules["taskiq"] = taskiq_mock
sys.modules["taskiq.schedule_sources"] = MagicMock()

taskiq_fastapi_mock = MagicMock()
taskiq_fastapi_mock.init = MagicMock()
sys.modules["taskiq_fastapi"] = taskiq_fastapi_mock

taskiq_redis_mock = MagicMock()
broker_mock = MagicMock()
broker_mock.task = mock_task_decorator
taskiq_redis_mock.ListQueueBroker = MagicMock(return_value=broker_mock)
sys.modules["taskiq_redis"] = taskiq_redis_mock

worker_mock = MagicMock()
worker_mock.broker = broker_mock
sys.modules["app.worker"] = worker_mock

# Load env vars

# Import ALL models to ensure relationships resolve
from sqlalchemy.orm import sessionmaker

# (Add other models if needed, e.g. PartnerTask if it exists in a separate file,
# but usually it's in partner.py or imported there)
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import engine
from app.services.partner_service import migrate_paths

async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def main():
    print("🚀 Starting Path Migration...")
    async with async_session_factory() as session:
        await migrate_paths(session)
    print("✅ Migration Complete!")

if __name__ == "__main__":
    asyncio.run(main())
