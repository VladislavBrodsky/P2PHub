import asyncio
import os
import sys

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import async_session_maker
from app.models.transaction import PartnerTransaction


async def check_p6_txs():
    async with async_session_maker() as session:
        print("--- All Transactions for Partner 6 ---")
        stmt = select(PartnerTransaction).where(PartnerTransaction.partner_id == 6)
        res = await session.exec(stmt)
        for t in res.all():
            print(f"ID: {t.id}, Hash: {t.tx_hash}, Status: {t.status}, Created: {t.created_at}")

if __name__ == "__main__":
    asyncio.run(check_p6_txs())
