
import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta, UTC
from sqlalchemy import text, String
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

# Configure logging for script output
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Add current directory to path for imports
sys.path.append(os.getcwd())

# Force load .env.backend using robust relative paths
from dotenv import load_dotenv
import os

# Possible paths relative to current execution context
env_targets = [
    "backend/env_prod.txt",
    "env_prod.txt",
    "backend/.env.backend",
    ".env.backend",
    "../.env.backend",
    "backend/.env",
    ".env"
]

env_loaded = False
for env_path in env_targets:
    if os.path.exists(env_path):
        try:
            load_dotenv(env_path, override=True)
            print(f"📖 Environment loaded from: {env_path}")
            env_loaded = True
            break
        except PermissionError:
            print(f"🚫 PERMISSION BLOCKED: Cannot read {env_path}. Check macOS 'Full Disk Access'.")
            continue
        except Exception:
            continue

if not env_loaded:
    print("⚠️ WARNING: No environment file found or access denied.")
    # Attempt to use what's already in the shell environment
    if os.getenv("DATABASE_URL"):
        print("✅ Using DATABASE_URL found in active shell.")
        env_loaded = True

from app.core.config import settings

# Manual synchronization for diagnostic accuracy
if os.getenv("DATABASE_URL") and not settings.DATABASE_URL:
    settings.DATABASE_URL = os.getenv("DATABASE_URL")
if os.getenv("BOT_TOKEN") and not settings.BOT_TOKEN:
    settings.BOT_TOKEN = os.getenv("BOT_TOKEN")

DB_URL = settings.async_database_url
url = DB_URL or os.getenv("DATABASE_URL")

async def check_systems():
    print(f"🔍 Starting Production System Health Audit...")
    
    if not url:
        print("❌ ERROR: DATABASE_URL not found. Audit aborted.")
        return
    
    engine = create_async_engine(url)
    async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # We need to import models here to ensure they are registered
    # Safely importing from the backend structure
    try:
        from app.models.partner import Partner, Earning, XPTransaction, PartnerTask
        from app.models.transaction import PartnerTransaction
        from app.models.audit_log import AuditLog
    except ImportError as e:
        print(f"❌ Failed to import models: {e}")
        return

    async with async_session_maker() as session:
        # Use timezone-aware UTC now for version 3.13 compatibility
        now = datetime.now(UTC).replace(tzinfo=None) # Keep naive for DB compatibility if needed, though SQLModel usually handles it
        last_24h = now - timedelta(hours=24)

        print("\n--- 👥 User Stats ---")
        total_partners = (await session.exec(select(func.count(Partner.id)))).one()
        new_partners_24h = (await session.exec(select(func.count(Partner.id)).where(Partner.created_at >= last_24h))).one()
        active_partners_24h = (await session.exec(select(func.count(Partner.id)).where(Partner.updated_at >= last_24h))).one()
        pro_partners = (await session.exec(select(func.count(Partner.id)).where(Partner.is_pro == True))).one()
        
        print(f"Total Partners: {total_partners}")
        print(f"New Partners (24h): {new_partners_24h}")
        print(f"Active Partners (24h): {active_partners_24h}")
        print(f"PRO Partners: {pro_partners}")

        print("\n--- 💰 PRO & Commissions ---")
        pro_purchases_24h = (await session.exec(select(func.count(PartnerTransaction.id)).where(
            PartnerTransaction.status == "completed",
            PartnerTransaction.created_at >= last_24h
        ))).one()
        
        commissions_24h = (await session.exec(select(func.count(Earning.id)).where(
            Earning.type == "COMMISSION",
            Earning.created_at >= last_24h
        ))).one()
        
        comm_sum_24h = (await session.exec(select(func.sum(Earning.amount)).where(
            Earning.type == "COMMISSION",
            Earning.created_at >= last_24h
        ))).one() or 0
        
        print(f"PRO Upgrades (24h): {pro_purchases_24h}")
        print(f"Commissions Distributed (24h): {commissions_24h}")
        print(f"Total Commissions (24h): {comm_sum_24h:.2f} USDT")

        print("\n--- ✨ XP & Referrals ---")
        xp_tx_24h = (await session.exec(select(func.count(XPTransaction.id)).where(XPTransaction.created_at >= last_24h))).one()
        xp_sum_24h = (await session.exec(select(func.sum(XPTransaction.amount)).where(XPTransaction.created_at >= last_24h))).one() or 0
        
        referral_entries_24h = (await session.exec(select(func.count(Partner.id)).where(
            Partner.referrer_id.is_not(None),
            Partner.created_at >= last_24h
        ))).one()

        print(f"XP Transactions (24h): {xp_tx_24h}")
        print(f"Total XP Awarded (24h): {xp_sum_24h:.0f} XP")
        print(f"New Referrals (24h): {referral_entries_24h}")

        print("\n--- 📋 Tasks ---")
        tasks_completed_24h = (await session.exec(select(func.count(PartnerTask.id)).where(
            PartnerTask.status == "COMPLETED",
            PartnerTask.completed_at >= last_24h
        ))).one()
        
        checkins_24h = (await session.exec(select(func.count(XPTransaction.id)).where(
            XPTransaction.type == "CHECKIN",
            XPTransaction.created_at >= last_24h
        ))).one()
        
        print(f"Tasks Completed (24h): {tasks_completed_24h}")
        print(f"Daily Check-ins (24h): {checkins_24h}")

        print("\n--- 🔔 Notifications & Audit ---")
        # Check audit log for notification actions
        notifications_24h = (await session.exec(select(func.count(AuditLog.id)).where(
            AuditLog.action.like("%notification%"),
            AuditLog.created_at >= last_24h
        ))).one()
        
        errors_24h = (await session.exec(select(func.count(AuditLog.id)).where(
            AuditLog.details.cast(String).like("%error%"),
            AuditLog.created_at >= last_24h
        ))).one()
        
        print(f"Notification Events (24h): {notifications_24h}")
        print(f"Audit Log Errors (24h): {errors_24h}")

        print("\n--- 🕸️ Network & Structural Health ---")
        orphaned_partners = (await session.exec(select(func.count(Partner.id)).where(
            Partner.referrer_id != None,
            Partner.path == None
        ))).one()
        
        broken_depth = (await session.exec(select(func.count(Partner.id)).where(
            Partner.depth == 0,
            Partner.referrer_id != None
        ))).one()

        print(f"Orphaned Partners (no path): {orphaned_partners}")
        print(f"Broken Depth (depth=0 with ref): {broken_depth}")
        
        if orphaned_partners > 0 or broken_depth > 0:
            print("⚠️ ACTION REQUIRED: Run Admin -> Recalculate Network Stats to fix structural anomalies.")




        if errors_24h > 0:
            print("\n🚨 Recent Errors from Audit Log:")
            recent_errors = (await session.exec(select(AuditLog).where(
                AuditLog.details.cast(String).like("%error%"),
                AuditLog.created_at >= last_24h
            ).limit(5))).all()
            for err in recent_errors:
                print(f"  - [{err.created_at}] Action: {err.action} | Details: {err.details}")

    await engine.dispose()
    print("\n✅ Audit Finished.")

if __name__ == "__main__":
    # Set necessary ENV VArs to bypass startup checks in models
    if DB_URL:
        os.environ["DATABASE_URL"] = DB_URL
    os.environ["BOT_TOKEN"] = "dummy"
    asyncio.run(check_systems())
