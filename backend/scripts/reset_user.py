import asyncio
import os
import sys

# Bootstrap
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import scripts._bootstrap  # noqa

from sqlmodel import select
from app.models.partner import Partner, async_session_maker

async def reset_user(username: str):
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username == username)
        user = (await session.exec(stmt)).first()
        if not user:
            print(f"User @{username} not found")
            return

        user.is_pro = False
        user.subscription_plan = None
        user.pro_expires_at = None
        
        # Cleanup previous upgrade records to avoid unique constraint clashes
        from app.models.partner import XPTransaction, Earning
        from sqlalchemy import delete
        await session.execute(delete(XPTransaction).where(XPTransaction.reference_id.like(f"upg_xp_{user.id}_%")))
        await session.execute(delete(Earning).where(Earning.reference_id.like(f"upg_{user.id}_%")))
        
        session.add(user)
        await session.commit()
        print(f"✅ Deep Reset @{username} to FREE (Cleared XP/Earning refs).")

if __name__ == "__main__":
    asyncio.run(reset_user("Rudskixx_Dmitry854"))
