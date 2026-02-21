
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import XPTransaction, async_session_maker

async def check_xp():
    async with async_session_maker() as session:
        stmt = select(XPTransaction).where(
            XPTransaction.type == 'REFERRAL_SIGNUP'
        ).order_by(XPTransaction.created_at.desc()).limit(10)
        txs = (await session.exec(stmt)).all()
        for t in txs:
            print(f"[{t.created_at}] ID {t.partner_id} gained {t.amount} XP | Ref_id {t.reference_id}")

if __name__ == "__main__":
    asyncio.run(check_xp())
