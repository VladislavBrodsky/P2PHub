
import asyncio
import os
import sys

# Set PYTHONPATH to include backend
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Hardcode environment variables
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
os.environ["BOT_TOKEN"] = "12345678:ABCDEF" # Dummy but properly formatted

# MOCK ALL DEPENDENCIES BEFORE IMPORTS
from unittest.mock import AsyncMock, MagicMock

mock_bot = MagicMock()
mock_bot.send_message = AsyncMock()

sys.modules["aiogram"] = MagicMock()
sys.modules["aiogram.client.bot"] = MagicMock()
sys.modules["aiogram.client.bot"].Bot = MagicMock(return_value=mock_bot)
sys.modules["bot"] = MagicMock()
sys.modules["bot"].bot = mock_bot

# MOCK taskiq & submodules
def mock_task_decorator(*args, **kwargs):
    def decorator(func):
        # We want the function to be available both normally and via .kiq() if needed
        # But here we just need it to be awaitable
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

# Also mock app.worker to provide our mocked broker
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

# Mocking services for clean output and to avoid local Redis/Notification issues
ps.redis_service = MagicMock()
ps.redis_service.client.delete = AsyncMock(return_value=None)
ps.redis_service.get_json = AsyncMock(return_value={})
ps.redis_service.set_json = AsyncMock(return_value=None)

ps.leaderboard_service = MagicMock()
ps.leaderboard_service.update_score = AsyncMock(return_value=None)

# We want to see the notifications!
async def mock_enqueue_notification(chat_id: int, text: str, parse_mode: str = "Markdown", retry_count: int = 0):
    print(f"   🔔 [NOTIFICATION] Chat: {chat_id} | Msg: {text}")

ps.notification_service = MagicMock()
ps.notification_service.enqueue_notification = AsyncMock(side_effect=mock_enqueue_notification)

async def run_simulation():
    print("🚀 Starting 9-Level Referral Chain Simulation...")

    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=False, future=True)
    async_session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session_factory() as session:
        # 1. Fetch @uslincoln
        res = await session.exec(select(Partner).where(Partner.username == "uslincoln"))
        root_user = res.first()
        if not root_user:
            print("❌ Error: @uslincoln not found in database.")
            return

        print(f"📊 Root User: @{root_user.username} (ID: {root_user.id}, Current XP: {root_user.xp})")
        initial_xp = root_user.xp

        referrer_code = root_user.referral_code
        chain = []

        import time
        ts = int(time.time())

        # 2. Create a chain of 9 users
        for i in range(1, 10):
            tg_id = f"SIM_{ts}_{i}"
            username = f"sim_user_{i}_{ts}"
            print(f"\n📦 Level {i}: Creating {username} under code {referrer_code}...")

            partner, is_new = await create_partner(
                session=session,
                telegram_id=tg_id,
                username=username,
                first_name=f"SimUser{i}",
                referrer_code=referrer_code
            )

            if is_new:
                # Manual trigger of referral logic since TaskIQ is mocked/not running
                print(f"   ⚙️ Processing Referral Logic for {username}...")
                # We need to ensure process_referral_logic uses our mocked services
                # but it recreates its own engine/session inside.
                # Actually, in the current implementation, it's a @broker.task.
                # Let's call the function directly.
                await process_referral_logic(partner.id)

                # We need to refresh the partners in the chain to see XP updates
                # but process_referral_logic uses its own session.
                # So we commit and refresh here.
                await session.commit()
                await session.refresh(partner)

            chain.append(partner)
            referrer_code = partner.referral_code

        print("\n" + "="*50)
        print("✅ Simulation Finished. Verifying Math...")
        print("="*50)

        # 3. Verify @uslincoln XP
        await session.refresh(root_user)
        xp_gain = root_user.xp - initial_xp
        # Expected: L1: 35, L2: 10, L3-L9: 1 each (7 users) -> 35 + 10 + 7 = 52 XP
        expected_xp_gain = 52

        print("👤 @uslincoln Stats:")
        print(f"   Initial XP: {initial_xp}")
        print(f"   Final XP:   {root_user.xp}")
        print(f"   Gain:       {xp_gain} (Expected: {expected_xp_gain})")

        if xp_gain == expected_xp_gain:
             print("   ✅ Math is CORRECT!")
        else:
             print(f"   ❌ Math MISMATCH! Diff: {xp_gain - expected_xp_gain}")

        # 4. Verify intermediate users
        # SimUser 1 (Level 1 under uslincoln) should be level 1 for SimUser 2...
        # SimUser 1 is root for 8 levels (User 2 to 9)
        # Expected for User 1: 35 (L1) + 10 (L2) + 6 (L3-L8) = 51 XP
        u1 = chain[0]
        await session.refresh(u1)
        print(f"\n👤 Level 1 User (@{u1.username}) Stats:")
        print(f"   XP: {u1.xp} (Expected: 51)")

        # SimUser 8 is root for 1 level (User 9)
        # Expected for User 8: 35 XP (L1)
        u8 = chain[7]
        await session.refresh(u8)
        print(f"\n👤 Level 8 User (@{u8.username}) Stats:")
        print(f"   XP: {u8.xp} (Expected: 35)")

        print("\n🗑️ Cleaning up simulation data (optional, but keep for verification)...")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_simulation())
