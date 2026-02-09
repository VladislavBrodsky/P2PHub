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
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Verify Referrer
        referrer_code = "P2P-425DA3DB"
        stmt = select(Partner).where(Partner.referral_code == referrer_code)
        res = await session.exec(stmt)
        referrer = res.first()
        
        if not referrer:
            print(f"❌ Referrer {referrer_code} not found!")
            return

        print(f"👤 Found Referrer: @{referrer.username} (ID: {referrer.id}) - XP: {referrer.xp}")
        initial_xp = referrer.xp

        # 2. Create New User
        ts = int(time.time())
        username = f"test_user_final_{ts}"
        tg_id = f"TEST_{ts}"
        
        print(f"🆕 Creating New Partner: @{username}...")
        partner, is_new = await create_partner(
            session=session,
            telegram_id=tg_id,
            username=username,
            first_name="Test User Final",
            referrer_code=referrer_code
        )
        
        if is_new:
            print("✅ Partner Created! Processing Referral Logic...")
            # Run simulation logic (updates DB XP, logs transactions)
            # Note: Notifications are mocked here, but DB effects happen
            await process_referral_logic(partner.id)
            
            await session.refresh(referrer)
            gain = referrer.xp - initial_xp
            print(f"💰 XP Update: {initial_xp} -> {referrer.xp} (+{gain} XP)")
            
            if gain == 35:
                print("✅ SUCCESS: +35 XP awarded correctly!")
            else:
                print(f"⚠️ WARNING: Gain was {gain} (Expected 35)")
        else:
            print("⚠️ User already existed.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_real_user())
