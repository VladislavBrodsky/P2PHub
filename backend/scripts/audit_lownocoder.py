import asyncio
import os
import sys
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.partner import Partner, async_session_maker

async def check_audit():
    async with async_session_maker() as session:
        print("--- Auditing @lownocoder_TMR Grant ---")
        stmt = select(Partner).where(Partner.username == "lownocoder_TMR")
        user = (await session.exec(stmt)).first()
        
        if not user:
            print("User not found!")
            return

        print(f"User: @{user.username}")
        print(f"PRO: {user.is_pro}")
        print(f"Plan: {user.subscription_plan}")
        print(f"Tokens: {user.pro_tokens}")
        print(f"Expires: {user.pro_expires_at}")
        
        print("\n--- Commissions Generated ---")
        # Use simple text query to avoid importing Earning model if not needed
        stmt_earnings = text(f"SELECT partner_id, amount, level, description, created_at FROM earning WHERE reference_id LIKE 'upg_{user.id}_%' ORDER BY level ASC")
        earnings_res = await session.exec(stmt_earnings)
        earnings = earnings_res.all()
        
        total_comm = 0.0
        
        if not earnings:
            print("⚠️ No commissions found. Maybe user has no upline?")
        else:
            for pid, amt, lvl, desc, cat in earnings:
                print(f"L{lvl}: Partner {pid} received ${amt} ({desc}) at {cat}")
                total_comm += float(amt)
                
        print(f"\nTotal Distributed: ${total_comm:.2f}")

if __name__ == "__main__":
    asyncio.run(check_audit())
