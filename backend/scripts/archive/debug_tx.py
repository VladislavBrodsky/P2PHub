import asyncio
import os
import sys

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

sys.path.append(os.getcwd())

from app.models.partner import Earning, Partner, XPTransaction, async_session_maker
from app.models.transaction import PartnerTransaction


async def debug_transactions():
    async with async_session_maker() as session:
        print("--- All PartnerTransactions ---")
        tx_stmt = select(PartnerTransaction).order_by(PartnerTransaction.created_at.desc()).limit(20)
        txs = (await session.exec(tx_stmt)).all()
        for tx in txs:
            print(f"ID: {tx.id}, Partner: {tx.partner_id}, Amount: {tx.amount}, Status: {tx.status}, Created: {tx.created_at}")
            
        print("\n--- All PRO Partners ---")
        p_stmt = select(Partner).where(Partner.is_pro == True)
        pro_partners = (await session.exec(p_stmt)).all()
        for p in pro_partners:
            print(f"ID: {p.id}, Username: {p.username}, PRO Since: {p.pro_purchased_at}, Last TX: {p.last_transaction_id}")

        print("\n--- Recent Earnings ---")
        e_stmt = select(Earning).order_by(Earning.created_at.desc()).limit(20)
        earnings = (await session.exec(e_stmt)).all()
        for e in earnings:
            print(f"ID: {e.id}, Partner: {e.partner_id}, Amount: {e.amount} {e.currency}, Type: {e.type}, Desc: {e.description}, Created: {e.created_at}")

if __name__ == "__main__":
    asyncio.run(debug_transactions())
