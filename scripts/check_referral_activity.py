
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker

async def check_user_notifications():
    async with async_session_maker() as session:
        telegram_id = '716720099'
        
        # Get user
        stmt_u = select(Partner).where(Partner.telegram_id == telegram_id)
        u = (await session.exec(stmt_u)).first()
        if not u:
            print("User not found.")
            return

        print(f"Recent Referral events for {u.username}:")
        
        stmt_earn = select(Earning).where(
            Earning.partner_id == u.id,
            Earning.type.in_(["COMMISSION", "REFERRAL_XP", "REFERRAL_SIGNUP"])
        ).order_by(Earning.created_at.desc()).limit(15)
        
        earns = (await session.exec(stmt_earn)).all()
        for e in earns:
            print(f"- [{e.created_at}] Type: {e.type:<12} | Amount: {e.amount:<6} {e.currency:<4} | Desc: {e.description}")

if __name__ == "__main__":
    asyncio.run(check_user_notifications())
