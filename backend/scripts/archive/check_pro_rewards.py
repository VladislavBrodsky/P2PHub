import asyncio
import os
import sys

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import Partner, XPTransaction, async_session_maker


async def check_pro_rewards():
    async with async_session_maker() as session:
        # uslincoln is partner ID 1
        print("--- XP Rewards for Partner 1 (PRO) ---")
        stmt = select(XPTransaction).where(XPTransaction.partner_id == 1).order_by(XPTransaction.created_at.desc()).limit(20)
        res = await session.exec(stmt)
        for tx in res.all():
            print(f"TX: {tx.id}, Amt: {tx.amount}, Type: {tx.type}, Desc: {tx.description}, Date: {tx.created_at}")

if __name__ == "__main__":
    asyncio.run(check_pro_rewards())
