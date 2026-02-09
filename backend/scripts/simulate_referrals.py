import asyncio
import sys
import os
from sqlmodel import select

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Manually load .env file to ensure variables are set before pydantic loads
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
print(f"Loading .env from {env_path}")
try:
    with open(env_path, "r") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                key, value = line.strip().split("=", 1)
                value = value.strip().strip('"').strip("'")
                
                # Fix for potential double assignment e.g. KEY=KEY=VALUE
                if value.startswith(f"{key}="):
                    print(f"⚠️ Fixing malformed env var for {key}")
                    value = value[len(key)+1:].strip().strip('"').strip("'")
                
                os.environ[key] = value
except Exception as e:
    print(f"Failed to load .env: {e}")


from app.models.partner import Partner, get_session, engine
from app.services.partner_service import create_partner, process_referral_logic



from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
import app.models.partner

# Access configuration via app.core.config
from app.core.config import settings

# Use the exact DB URL from .env
db_url = settings.DATABASE_URL
print(f"Using DB Host: {db_url.split('@')[-1]}") # Mask credentials for debug

# Ensure async driver for SQLAlchemy if missing
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Create engine (add SSL context if needed, but rely on URL params first)
# For Railway production, usually no special params needed if URL is correct
local_engine = create_async_engine(db_url, echo=True, future=True)

# Patch the global engine in app.models.partner so internal functions use it
app.models.partner.engine = local_engine


# Re-create session factory with the local engine
async_session_factory = sessionmaker(
    local_engine, class_=AsyncSession, expire_on_commit=False
)

from unittest.mock import AsyncMock, MagicMock
from app.services import partner_service as ps

# Mock Redis and Leaderboard services to avoid connection errors
ps.redis_service = MagicMock()
ps.redis_service.client.delete = AsyncMock(return_value=None)
ps.redis_service.get_json = AsyncMock(return_value={})
ps.redis_service.set_json = AsyncMock(return_value=None)

ps.leaderboard_service = MagicMock()
ps.leaderboard_service.update_score = AsyncMock(return_value=None)

ps.notification_service = MagicMock()
ps.notification_service.enqueue_notification = AsyncMock(return_value=None)

print("⚡️ Mocked Redis, Leaderboard, and Notification services.")

async def run_simulation():
    print("🚀 Starting Referral Simulation (10 Users)...")
    
    # We need a bot mock for process_referral_logic notifications
    class MockBot:
        async def send_message(self, chat_id, text, parse_mode=None):
            print(f"   [BOT] Sending to {chat_id}: {text[:50]}...")

    bot = MockBot()

    async with async_session_factory() as session:
        # Clear previous test data? NO, let's append unique users
        import time
        timestamp = int(time.time())
        
        users = []
        referrer_code = None
        
        # Create User 0 (Root) -> User 9 (Leaf)
        for i in range(10):
            tg_id = f"TEST_{timestamp}_{i}"
            username = f"user_{timestamp}_{i}"
            
            print(f"Creating User {i}: {username} (Ref: {referrer_code})")
            
            partner, is_new = await create_partner(
                session=session,
                telegram_id=tg_id,
                username=username,
                first_name=f"TestUser{i}",
                referrer_code=referrer_code
            )
            
            if is_new and partner.referrer_id:
                print(f"   -> Processing Referral Logic for {username}...")
                await process_referral_logic(bot, session, partner)
            
            users.append(partner)
            referrer_code = partner.referral_code # Next user refers to this one
            
        print("\n✅ Simulation Complete. Verifying Data...")
        
        # Verification
        # User 0 should have XP from 9 downstream users
        # L1 (User 1) = 35 XP
        # L2 (User 2) = 15 XP
        # L3 (User 3) = 10 XP
        # L4-L9 (User 4-9) = 5 XP * 6 = 30 XP
        # Total Expected XP for User 0 = 35 + 15 + 10 + 30 = 90 XP
        
        root_user = await session.get(Partner, users[0].id)
        print(f"\nUser 0 ({root_user.username}) Stats:")
        print(f"   XP: {root_user.xp} (Expected ~90 from this chain)")
        print(f"   Level: {root_user.level}")
        
        # Verify deeper levels
        # User 1 should have XP from User 2 (L1) ... User 9 (L8)
        # Expected: 35 + 15 + 10 + (5*5) = 85 XP
        user_1 = await session.get(Partner, users[1].id)
        print(f"User 1 ({user_1.username}) Stats:")
        print(f"   XP: {user_1.xp} (Expected ~85)")

        # Verify Database Tree Integrity
        # Count total partners in DB
        result = await session.exec(select(Partner).where(Partner.telegram_id.startswith(f"TEST_{timestamp}")))
        created_count = len(result.all())
        print(f"\nTotal Test Users Created: {created_count}/10")

from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
async def post_session():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    return async_session()

if __name__ == "__main__":
    asyncio.run(run_simulation())
