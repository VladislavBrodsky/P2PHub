
import asyncio
import os
import sys
from datetime import datetime, UTC

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker
from app.models.transaction import PartnerTransaction

async def find_today_buyers():
    async with async_session_maker() as session:
        now = datetime.now(UTC).replace(tzinfo=None)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        stmt = select(PartnerTransaction).where(PartnerTransaction.status == "completed", PartnerTransaction.created_at >= today_start)
        res = await session.exec(stmt)
        txs = res.all()
        
        print(f"🛒 Completed Transactions Today ({len(txs)}):")
        for tx in txs:
            res_p = await session.exec(select(Partner).where(Partner.id == tx.partner_id))
            p = res_p.first()
            if p:
                print(f"- @{p.username} ({p.telegram_id}) | ID: {p.id} | Amount: {tx.amount} | Hash: {tx.tx_hash}")
                # Print lineage
                if p.path:
                    ids = [int(i) for i in p.path.split('.')]
                    path_str = " -> ".join([str(i) for i in ids])
                    print(f"  Lineage: {path_str} -> {p.id}")
                elif p.referrer_id:
                    print(f"  Lineage: {p.referrer_id} -> {p.id}")
                else:
                    print(f"  Lineage: No Referrer")

if __name__ == "__main__":
    asyncio.run(find_today_buyers())
