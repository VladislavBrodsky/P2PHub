
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from datetime import datetime, UTC
from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker

async def check_commissions():
    today = datetime.now(UTC).replace(tzinfo=None).replace(hour=0, minute=0, second=0, microsecond=0)
    async with async_session_maker() as session:
        stmt = select(Earning).where(
            Earning.type == "COMMISSION",
            Earning.created_at >= today
        ).order_by(Earning.created_at.desc())
        commissions = (await session.exec(stmt)).all()
        
        print(f"Total commissions today: {len(commissions)}")
        for i, c in enumerate(commissions):
            u = await session.get(Partner, c.partner_id)
            print(f"[{c.created_at}] to {u.username} (ID: {c.partner_id}) | {c.amount} {c.currency} | {c.description}")

if __name__ == "__main__":
    asyncio.run(check_commissions())
