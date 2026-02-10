import sys
import os
import asyncio

# Set up path to match production (root is 'backend/')
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

print(f"🔍 Starting Diagnostic Check from {backend_path}...")

try:
    print("1. Loading Environment...")
    # Import as 'app.core.config', not 'backend.app...'
    from app.core.config import settings
    # Force a dummy DB url if not present to avoid ArgumentError but respect existing
    if not settings.DATABASE_URL:
        print("   ⚠️ DATABASE_URL is empty. using sqlite fallback.")
        settings.DATABASE_URL = "sqlite+aiosqlite:///dev.db"
        
    print(f"   DATABASE_URL: {settings.DATABASE_URL.split('://')[0]}://***")
    print(f"   REDIS_URL: {settings.REDIS_URL.split('://')[0]}://***")
except Exception as e:
    print(f"❌ Failed to load config: {e}")
    sys.exit(1)

try:
    print("2. Importing Models...")
    from app.models.partner import Partner, engine
    print("   Models imported.")
except Exception as e:
    print(f"❌ Failed to import models: {e}")
    sys.exit(1)

try:
    print("3. Importing Services...")
    from app.services.partner_service import partner_service
    from app.services.leaderboard_service import leaderboard_service
    from app.services.notification_service import notification_service
    # Also check subscription service which had the await issue
    from app.services.subscription_service import subscription_service
    print("   Services imported.")
except Exception as e:
    print(f"❌ Failed to import services: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    print("4. Importing Main App...")
    from app.main import app
    print("   Main app imported.")
except Exception as e:
    print(f"❌ Failed to import main app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("✅ All imports successful. Startup diagnostics passed.")
