
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker

async def audit():
    async with async_session_maker() as session:
        print("\n=== RE-AUDIT: L20 XP (Sarah Jenkins) ===")
        stmt = select(Earning).where(
            Earning.reference_id.like("ref_xp_348_%") # 348 is Sarah's ID from previous log
        ).order_by(Earning.amount.desc())
        
        comms = (await session.exec(stmt)).all()
        for c in comms:
            rx = await session.get(Partner, c.partner_id)
            print(f"{rx.username} got {c.amount} {c.currency} -> {c.description}")

if __name__ == "__main__":
    asyncio.run(audit())
