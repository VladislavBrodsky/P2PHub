import os
# Production DB URL - MUST BE SET BEFORE IMPORTS
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

import asyncio
import secrets
import time
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

# MOCK BOT & AIOGRAM & TASKIQ
from unittest.mock import MagicMock
import sys
import os

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
from app.models.partner import Partner, XPTransaction, engine
from app.models.transaction import PartnerTransaction
from app.services.partner_service import create_partner, process_referral_logic

async def create_real_user():
    print("🚀 Connecting to Production DB...")
    async_session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_factory() as session:
        # REFERRER: @uslincoln (ID 1)
        referrer_code = "P2P-425DA3DB"
        print(f"🚀 Starting 3-Level Notification Test for code: {referrer_code}...")

        # 1. Fetch Root (User A)
        res = await session.exec(select(Partner).where(Partner.referral_code == referrer_code))
        root_user = res.first()
        if not res:
            print(f"❌ Error: Partner with code {referrer_code} not found.")
            return

        print(f"👤 Root User Found: @{root_user.username} (ID: {root_user.id}) - XP: {root_user.xp}")
        
        # 2. Level 1: User B joins under User A
        user_b_id = f"TEST_L1_{secrets.token_hex(4)}"
        user_b_username = f"User_B_{user_b_id}"
        print(f"\n🆕 Registering Level 1 User: @{user_b_username} under {referrer_code}...")
        
        user_b, is_new_b = await ps.create_partner(
            session,
            telegram_id=user_b_id,
            username=user_b_username,
            first_name="User",
            last_name="B",
            referrer_code=referrer_code
        )
        
        await ps.process_referral_logic(user_b.id)
        
        # Refresh Root to check L1 XP
        session.expire(root_user)
        await session.refresh(root_user)
        print(f"💰 Root User XP after L1: {root_user.xp} (+35 XP Expected)")

        # 3. Level 2: User C joins under User B
        referrer_code_b = user_b.referral_code
        user_c_id = f"TEST_L2_{secrets.token_hex(4)}"
        user_c_username = f"User_C_{user_c_id}"
        print(f"\n🆕 Registering Level 2 User: @{user_c_username} under {referrer_code_b}...")

        user_c, is_new_c = await ps.create_partner(
            session,
            telegram_id=user_c_id,
            username=user_c_username,
            first_name="User",
            last_name="C",
            referrer_code=referrer_code_b
        )

        await ps.process_referral_logic(user_c.id)

        # Refresh Root to check L2 XP and Notification Context
        session.expire(root_user)
        await session.refresh(root_user)
        print(f"💰 Root User XP after L2: {root_user.xp} (+10 XP Expected)")
        
        # 4. Level 3: User D joins under User C
        referrer_code_c = user_c.referral_code
        user_d_id = f"TEST_L3_{secrets.token_hex(4)}"
        user_d_username = f"User_D_{user_d_id}"
        print(f"\n🆕 Registering Level 3 User: @{user_d_username} under {referrer_code_c}...")
        
        user_d, is_new_d = await ps.create_partner(
            session,
            telegram_id=user_d_id,
            username=user_d_username,
            first_name="User",
            last_name="D",
            referrer_code=referrer_code_c
        )
        
        await ps.process_referral_logic(user_d.id)
        
        # Refresh Root to check L3 XP and Chain Notification
        session.expire(root_user)
        await session.refresh(root_user)
        print(f"💰 Root User XP after L3: {root_user.xp} (+1 XP Expected)")

        print("\n✅ Simulation Complete!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_real_user())
