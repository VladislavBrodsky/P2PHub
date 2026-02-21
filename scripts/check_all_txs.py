
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import async_session_maker, XPTransaction, Earning

async def check():
    async with async_session_maker() as session:
        for p_id in [286, 287, 283, 284, 285]:
            stmt = select(XPTransaction).where(XPTransaction.reference_id == str(p_id))
            xps = (await session.exec(stmt)).all()
            print(f"Partner {p_id} XP:")
            for xp in xps:
                print(f"  - Partner {xp.partner_id} gained {xp.amount} XP, Type: {xp.type}")
            
            # Check Earnings containing the id
            stmt2 = select(Earning).where(Earning.reference_id.like(f"%{p_id}%"))
            earns = (await session.exec(stmt2)).all()
            print(f"Partner {p_id} Earns:")
            for earn in earns:
                print(f"  - Partner {earn.partner_id} gained {earn.amount} {earn.currency}, Ref: {earn.reference_id}")

if __name__ == "__main__":
    asyncio.run(check())
