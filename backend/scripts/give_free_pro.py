import asyncio
import os
import sys
from datetime import datetime, UTC
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.partner import Partner, async_session_maker

USERNAMES = ["wwestic", "Ksu_Ust"]

async def give_free_pro():
    async with async_session_maker() as session:
        print("--- Granting FREE PRO (Lifetime) ---")
        
        for username in USERNAMES:
            print(f"\nProcessing @{username}...")
            stmt = select(Partner).where(Partner.username == username)
            user = (await session.exec(stmt)).first()
            
            if not user:
                print(f"❌ User @{username} not found in database!")
                continue

            # Update User
            user.is_pro = True
            user.subscription_plan = "PRO_LIFETIME"
            user.pro_expires_at = None # Lifetime
            user.pro_tokens = 250 # Standard PRO allocation
            user.pro_started_at = datetime.now(UTC).replace(tzinfo=None)
            
            # Explicitly noting this is a gift in payment details if we want to track it, 
            # though not strictly required by prompt, it's good practice.
            # user.payment_details = '{"gift": true, "reason": "Admin Gift", "commission_skipped": true}'
            
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            print(f"✅ @{username} is now PRO Lifetime.")
            print(f"   Tokens: {user.pro_tokens}")
            print("   Commission: SKIPPED (Free Gift)")

if __name__ == "__main__":
    asyncio.run(give_free_pro())
