
import asyncio
import os
import sys
import time
from unittest.mock import AsyncMock, MagicMock

# Set PYTHONPATH to include backend
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Hardcode environment variables
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
os.environ["BOT_TOKEN"] = "12345678:ABCDEF"

# MOCK ALL DEPENDENCIES BEFORE IMPORTS
mock_bot = MagicMock()
mock_bot.send_message = AsyncMock()

sys.modules["aiogram"] = MagicMock()
sys.modules["aiogram.client.bot"] = MagicMock()
sys.modules["aiogram.client.bot"].Bot = MagicMock(return_value=mock_bot)
sys.modules["bot"] = MagicMock()
sys.modules["bot"].bot = mock_bot

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

# Import models & services AFTER all mocks
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner
from app.services import partner_service as ps
from app.services.partner_service import create_partner, process_referral_logic

# Mocking services for clean output
ps.redis_service = MagicMock()
ps.redis_service.client.delete = AsyncMock(return_value=None)
ps.leaderboard_service = MagicMock()
ps.leaderboard_service.update_score = AsyncMock(return_value=None)

# We want to see the notifications!
async def mock_enqueue_notification(chat_id: int, text: str, parse_mode: str = "Markdown", retry_count: int = 0):
    print(f"\n   🔔 [NOTIFICATION] Chat: {chat_id}")
    print(f"      {text}")

ps.notification_service = MagicMock()
ps.notification_service.enqueue_notification = AsyncMock(side_effect=mock_enqueue_notification)

async def run_simulation():
    start_code = "P2P-425DA3DB"
    print(f"🚀 Starting 6-Level Chain Simulation from code: {start_code}")

    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=False, future=True)
    async_session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_factory() as session:
        # 1. Fetch Root User
        res = await session.exec(select(Partner).where(Partner.referral_code == start_code))
        root_user = res.first()
        if not root_user:
            print(f"❌ Error: Partner with code {start_code} not found.")
            return

        print(f"👤 Root User Found: @{root_user.username} (ID: {root_user.id})")
        initial_xp = root_user.xp

        referrer_code = start_code
        ts = int(time.time())

        # 2. Create a chain of 6 users
        for i in range(1, 7):
            username = f"chain_user_{i}_{ts}"
            tg_id = f"CH_{ts}_{i}"
            print(f"\n📦 Step {i}: Registering @{username} under {referrer_code}...")

            partner, is_new = await create_partner(
                session=session,
                telegram_id=tg_id,
                username=username,
                first_name=f"ChainUser{i}",
                referrer_code=referrer_code
            )

            if is_new:
                await process_referral_logic(partner.id)
                await session.commit()
                await session.refresh(partner)

                # Next user registers under the newly created user
                referrer_code = partner.referral_code
            else:
                print("   ⚠️ User already existed, skipping logic.")

        # 3. Final Verification
        await session.refresh(root_user)
        gain = root_user.xp - initial_xp
        print("\n" + "="*50)
        print("📊 FINAL RESULTS")
        print("="*50)
        print(f"👤 @{root_user.username}:")
        print(f"   Initial XP: {initial_xp}")
        print(f"   Final XP:   {root_user.xp}")
        print(f"   TOTAL GAIN: {gain} XP")

        # Breakdown:
        # User 1 -> L1 (35 XP)
        # User 2 -> L2 (10 XP)
        # User 3 -> L3 (1 XP)
        # User 4 -> L4 (1 XP)
        # User 5 -> L5 (1 XP)
        # User 6 -> L6 (1 XP)
        # Total Expected: 35 + 10 + 4 = 49 XP
        print("   Expected:   49.0 XP")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_simulation())
