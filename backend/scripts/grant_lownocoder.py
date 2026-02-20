import asyncio
import os
import sys
from datetime import UTC, datetime

from dotenv import load_dotenv
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

# Force load .env from P2PHub root or backend
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.env"))

if os.path.exists(root_env):
    print(f"Loading env from {root_env}")
    load_dotenv(root_env, override=True)
elif os.path.exists(backend_env):
    print(f"Loading env from {backend_env}")
    load_dotenv(backend_env, override=True)
else:
    print(f"❌ No .env found at {root_env} or {backend_env}")

# Add the backend directory to sys.path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# MOCK REDIS SERVICE to prevent connection errors in script
from unittest.mock import AsyncMock, MagicMock

import app.services.redis_service
from app.models.partner import Partner, async_session_maker

mock_redis = MagicMock()
mock_redis.client = MagicMock()
mock_redis.client.pipeline.return_value.__aenter__.return_value = AsyncMock()
mock_redis.client.pipeline.return_value.__aexit__.return_value = AsyncMock()
mock_redis.client.delete = AsyncMock()
app.services.redis_service.redis_service = mock_redis

from app.services.referral_service import distribute_pro_commissions

# Hardcoded settings values I saw in config.py
PRO_PRICE_USD = 39.0

async def grant_pro():
    async with async_session_maker() as session:
        print("--- Granting PRO Lifetime to @lownocoder_TMR ---")
        
        # 1. Get User
        stmt = select(Partner).where(Partner.username == "lownocoder_TMR")
        user = (await session.exec(stmt)).first()
        
        if not user:
            print("❌ User @lownocoder_TMR not found in database! Please create them first or check spelling.")
            return

        print(f"Found user: @{user.username} (ID: {user.id})")
        print(f"Current Status: Is PRO: {user.is_pro}, Plan: {user.subscription_plan}, Tokens: {user.pro_tokens}")

        # 2. Grant PRO Lifetime
        print("\nACTION: Updating user to PRO Lifetime & 250 Tokens...")
        user.is_pro = True
        user.subscription_plan = "PRO_LIFETIME"
        user.pro_expires_at = None # Lifetime
        user.pro_tokens = 250
        user.pro_started_at = datetime.now(UTC).replace(tzinfo=None)
        
        session.add(user)
        # Flush to ensure user is updated before commission
        await session.flush()
        
        # 3. Distribute Commissions (Audit Flow)
        print("\nACTION: Triggering Commission Distribution Logic (Audit)...")
        # Check current commissions before
        stmt_audit_before = text("SELECT COUNT(*) FROM earning WHERE type = 'COMMISSION'")
        audit_res_before = (await session.exec(stmt_audit_before)).one()
        
        # Distribute $39 commission
        await distribute_pro_commissions(session, user.id, PRO_PRICE_USD)
        
        # Commit everything
        await session.commit()
        await session.refresh(user)
        
        # 4. Final Check
        print("\n--- FINAL STATUS ---")
        print(f"Is PRO: {user.is_pro}")
        print(f"Plan: {user.subscription_plan}")
        print(f"Expires: {user.pro_expires_at} (None means Lifetime)")
        print(f"Tokens: {user.pro_tokens} (Should be 250)")
        
        # Audit new commissions
        stmt_audit_after = text("SELECT COUNT(*) FROM earning WHERE type = 'COMMISSION'")
        audit_res_after = (await session.exec(stmt_audit_after)).one()
        # .one() returns a scalar if select is just one column, or a tuple/row if multiple?
        # Text query usually returns tuples.
        # Let's cast to int
        count_before = audit_res_before if isinstance(audit_res_before, int) else audit_res_before[0]
        count_after = audit_res_after if isinstance(audit_res_after, int) else audit_res_after[0]
        
        new_commissions = count_after - count_before
        print(f"✅ Commissions Generated: {new_commissions} (should match upline depth, max 20)")
        
        # List the recent commissions for this user's purchase
        print("\n--- NEW COMMISSIONS DETAILS ---")
        # We look for earnings with reference_id starting with 'upg_{user.id}_'
        stmt_earnings = text(f"SELECT partner_id, amount, level, description FROM earning WHERE reference_id LIKE 'upg_{user.id}_%' ORDER BY level ASC")
        earnings_res = await session.exec(stmt_earnings)
        earnings = earnings_res.all()
        
        if not earnings:
            print("⚠️ No commissions found! Check if user has an upline/referrer.")
            # Check referrer
            if user.referrer_id:
                print(f"User has referrer ID: {user.referrer_id}. Maybe referrer chain is short or not qualified?")
            else:
                print("User has NO referrer. Commissions go to Admin/System.")
        
        for pid, amt, lvl, desc in earnings:
            print(f"L{lvl}: User {pid} received ${amt:.2f} ({desc})")
            
        print("\n✅ DONE.")

if __name__ == "__main__":
    asyncio.run(grant_pro())
