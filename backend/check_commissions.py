import asyncio
import os
import sys
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import Partner, Earning, async_session_maker

async def check_commissions():
    async with async_session_maker() as session:
        print("--- Recent Commissions ---")
        stmt = select(Earning).where(Earning.type == "COMMISSION").order_by(Earning.created_at.desc()).limit(20)
        res = await session.exec(stmt)
        for e in res.all():
            print(f"Partner: {e.partner_id}, Amt: {e.amount}, Desc: {e.description}, Date: {e.created_at}")

if __name__ == "__main__":
    asyncio.run(check_commissions())
