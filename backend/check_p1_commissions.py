import asyncio
import os
import sys

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import Earning, Partner, async_session_maker


async def check_all_commissions_p1():
    async with async_session_maker() as session:
        print("--- All Commissions for Partner 1 ---")
        stmt = select(Earning).where(Earning.partner_id == 1, Earning.type == "COMMISSION").order_by(Earning.created_at.desc())
        res = await session.exec(stmt)
        for e in res.all():
            print(f"Amt: {e.amount}, Desc: {e.description}, Date: {e.created_at}")

if __name__ == "__main__":
    asyncio.run(check_all_commissions_p1())
