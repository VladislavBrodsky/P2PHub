import sys
import os
import asyncio
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

print("🔍 Starting Diagnostic Check...")

try:
    print("1. Loading Environment...")
    from app.core.config import settings
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
    from app.services.partner_service import create_partner
    from app.services.leaderboard_service import leaderboard_service
    from app.services.notification_service import notification_service
    print("   Services imported.")
except Exception as e:
    print(f"❌ Failed to import services: {e}")
    sys.exit(1)

try:
    print("4. Importing Main App...")
    from app.main import app
    print("   Main app imported.")
except Exception as e:
    print(f"❌ Failed to import main app: {e}")
    # Print full traceback
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("✅ All imports successful. Startup diagnostics passed.")
