
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker

async def check_buyer_commissions(buyer_id):
    async with async_session_maker() as session:
        # Check Earnings referencing this buyer
        # Reference ID format for commissions: upg_{partner_id}_{comm_level}
        stmt = select(Earning).where(Earning.reference_id.like(f"upg_{buyer_id}_%"))
        res = await session.exec(stmt)
        earnings = res.all()
        
        print(f"💰 Commissions distributed for Buyer {buyer_id}:")
        if not earnings:
            print("❌ No commissions found in Earning table.")
        for e in earnings:
            print(f"- {e.created_at} | To Partner {e.partner_id} | {e.amount} {e.currency} | {e.description}")

        # Check XP
        stmt_xp = select(Earning).where(Earning.type == "REFERRAL_XP", Earning.description.contains(str(buyer_id)))
        res_xp = await session.exec(stmt_xp)
        xp_earnings = res_xp.all()
        print(f"\n✨ XP Rewards distributed for Buyer {buyer_id}:")
        for e in xp_earnings:
            print(f"- To Partner {e.partner_id} | {e.amount} {e.currency} | {e.description}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 check_buyer_comms.py <buyer_id>")
    else:
        asyncio.run(check_buyer_commissions(int(sys.argv[1])))
