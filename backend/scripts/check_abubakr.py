import asyncio
import os
import sys
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

import sys
import os
# Add the backend directory to sys.path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.partner import Partner, async_session_maker

async def check_user():
    async with async_session_maker() as session:
        print("--- Checking User @Abubakr_Hakim ---")
        stmt = select(Partner).where(Partner.username == "Abubakr_Hakim")
        result = await session.exec(stmt)
        user = result.first()
        
        if not user:
            print("❌ User @Abubakr_Hakim not found in database!")
            return

        print(f"ID: {user.id}")
        print(f"Telegram ID: {user.telegram_id}")
        print(f"Pro Status: {user.is_pro}")
        print(f"Plan: {user.subscription_plan}")
        print(f"Expires: {user.pro_expires_at}")
        print(f"Tokens: {user.pro_tokens}")
        print(f"Balance: {user.balance}")
        
        if user.is_pro:
            print("✅ User is PRO.")
        else:
            print("❌ User is NOT PRO.")
            
        if user.pro_tokens == 250:
             print("✅ Tokens Verified (250).")
        else:
             print(f"⚠️ Token Mismatch! Has {user.pro_tokens}, expected 250.")
             
        # Check Dashboard Access (Simulated by checking status)
        if user.is_pro:
            print("✅ Dashboard Access: GRANTED (via PRO status)")
        else:
            print("❌ Dashboard Access: DENIED")

if __name__ == "__main__":
    asyncio.run(check_user())
