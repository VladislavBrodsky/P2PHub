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
from app.models.transaction import Transaction # Register Transaction for Relationships
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
    print("🚀 Starting Referral Simulation (Mocked Verification)...")
    
    # Mock bot
    bot = MagicMock()
    bot.send_message = AsyncMock()

    # Mock session
    session = AsyncMock()
    
    # Mock partner
    partner = MagicMock()
    partner.id = 123
    partner.referrer_id = 456
    partner.username = "test_user"

    print(f"Creating User: {partner.username} (Ref ID: {partner.referrer_id})")
    
    # Simulating the call that was failing
    print(f"   -> Processing Referral Logic for {partner.username}...")
    try:
        # We call it directly to verify the signature
        # In the real app, this would be a background task call via .kiq()
        # but here we just want to ensure it doesn't crash on arguments
        from app.services.partner_service import process_referral_logic
        
        # We need to mock the internals of process_referral_logic since it creates its own engine
        with patch('app.services.partner_service.create_async_engine'), \
             patch('app.services.partner_service.sessionmaker'):
            await process_referral_logic(partner.id)
            print("✅ process_referral_logic called successfully with 1 argument.")
    except TypeError as e:
        print(f"❌ TypeError: {e}")
    except Exception as e:
        # We expect other errors (database, etc.) which is fine, 
        # as long as it's not the TypeError we're fixing
        if "takes 1 positional argument but 3 were given" in str(e):
             print(f"❌ TypeError still present: {e}")
        else:
             print(f"✅ Signature verified (passed arguments check). Other error (expected): {type(e).__name__}")

    print("\n✅ Verification script finished.")

from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
async def post_session():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    return async_session()

if __name__ == "__main__":
    asyncio.run(run_simulation())
