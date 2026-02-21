
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker

async def query_comms():
    async with async_session_maker() as session:
        # Get Sarah
        stmt = select(Partner).where(Partner.telegram_id == '88800020')
        sarah = (await session.exec(stmt)).first()
        
        print("\n=== RE-AUDIT: PRO COMMISSIONS ===")
        stmt_comm = select(Earning).where(
            Earning.type == "COMMISSION"
        ).order_by(Earning.created_at.desc()).limit(25)
        comms = (await session.exec(stmt_comm)).all()
        for c in comms:
            rx = await session.get(Partner, c.partner_id)
            print(f"[{c.created_at}] {rx.username} got {c.amount} {c.currency} -> {c.description}")
            
if __name__ == "__main__":
    asyncio.run(query_comms())
