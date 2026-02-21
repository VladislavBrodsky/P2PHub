
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker

async def check_earnings_for_new_referrals():
    ref_ids = [286, 287, 283, 284, 285]
    async with async_session_maker() as session:
        for rid in ref_ids:
            # We look for earnings whose reference_id contains the partner's id
            # Format: f"ref_xp_{partner.id}_{referrer.id}"
            stmt = select(Earning).where(Earning.reference_id.like(f"ref_xp_{rid}_%"))
            earnings = (await session.exec(stmt)).all()
            
            p = await session.get(Partner, rid)
            print(f"Earnings for referral {p.username} (ID: {rid}):")
            if not earnings:
                print("  - None!")
            for e in earnings:
                receiver = await session.get(Partner, e.partner_id)
                print(f"  - Awarded to: {receiver.username} | {e.amount} {e.currency} | {e.description}")

if __name__ == "__main__":
    asyncio.run(check_earnings_for_new_referrals())
