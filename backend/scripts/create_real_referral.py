import os

# Production DB URL - MUST BE SET BEFORE IMPORTS
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

import asyncio
import os
import secrets
import sys

# MOCK BOT & AIOGRAM & TASKIQ
from unittest.mock import MagicMock

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock Service Dependencies (Redis, Leaderboard, Notification)
from unittest.mock import AsyncMock

# Redis
redis_module = MagicMock()
redis_service_mock = MagicMock()
redis_service_mock.client.delete = AsyncMock(return_value=None)
redis_service_mock.get_json = AsyncMock(return_value=None)
redis_service_mock.set_json = AsyncMock(return_value=None)
redis_module.redis_service = redis_service_mock
sys.modules["app.services.redis_service"] = redis_module

# Leaderboard
lb_module = MagicMock()
lb_service_mock = MagicMock()
lb_service_mock.update_score = AsyncMock(return_value=None)
lb_module.leaderboard_service = lb_service_mock
sys.modules["app.services.leaderboard_service"] = lb_module

# Notification
notif_module = MagicMock()
notif_service_mock = MagicMock()
notif_service_mock.enqueue_notification = AsyncMock(return_value=None)
notif_module.notification_service = notif_service_mock
sys.modules["app.services.notification_service"] = notif_module

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

# Patch actual imports in partner_service
from unittest.mock import AsyncMock

import app.services.partner_service as ps

ps.redis_service = MagicMock()
ps.redis_service.client.delete = AsyncMock(return_value=None)
ps.leaderboard_service = MagicMock()
ps.leaderboard_service.update_score = AsyncMock(return_value=None)
ps.notification_service = MagicMock()
ps.notification_service.enqueue_notification = AsyncMock(return_value=None)

# Import Models & Logic
from app.models.partner import Partner, engine


async def create_real_user():
    print("🚀 Connecting to Production DB...")
    async_session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_factory() as session:
        # REFERRER: @uslincoln (ID 1)
        referrer_code = "P2P-425DA3DB"
        print(f"🚀 Starting 9-Level Deep Verification for code: {referrer_code}...")

        # 1. Fetch Root (User A)
        res = await session.exec(select(Partner).where(Partner.referral_code == referrer_code))
        root_user = res.first()
        if not root_user:
            print(f"❌ Error: Partner with code {referrer_code} not found.")
            return

        print(f"👤 Root User Found: @{root_user.username} (Level: {root_user.level}) - Start XP: {root_user.xp}")

        initial_xp = root_user.xp
        current_referrer_code = referrer_code

        # Expected Rewards
        XP_MAP = {1: 35.0, 2: 10.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0, 9: 1.0}

        for level in range(1, 10):
            # Create User at this Level
            new_id = f"TEST_LVL_{level}_{secrets.token_hex(3)}"
            new_username = f"User_L{level}_{new_id}"

            print(f"\n--- Level {level} Joined ---")
            print(f"🆕 Registering @{new_username} under {current_referrer_code}...")

            new_partner, is_new = await ps.create_partner(
                session,
                telegram_id=new_id,
                username=new_username,
                first_name=f"User L{level}",
                referrer_code=current_referrer_code
            )

            # Run Logic
            await ps.process_referral_logic(new_partner.id)

            # Verify Root XP
            session.expire(root_user)
            await session.refresh(root_user)

            XP_MAP.get(level, 0)
            # We can't easily track exact incremental gain without storing previous,
            # but we can check if it increased.
            # Better: Calculate "Total Expected so far"

            print(f"💰 Root User XP: {root_user.xp}")

            # Update referrer for next iteration (chaining down)
            current_referrer_code = new_partner.referral_code

        final_xp = root_user.xp
        total_gained = final_xp - initial_xp
        expected_total = sum(XP_MAP.values())

        print("\n=== FINAL VERIFICATION ===")
        print(f"Total XP Gained: {total_gained}")
        print(f"Expected Total:  {expected_total}")

        if abs(total_gained - expected_total) < 0.1:
             print("✅ SUCCESS: 9-Level XP Sync Verified Perfectly!")
        else:
             print(f"❌ FAILURE: Mismatch! (Diff: {total_gained - expected_total})")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_real_user())
