
import asyncio
from sqlmodel import select, func
from app.models.transaction import PartnerTransaction
from app.models.partner import engine
from sqlmodel.ext.asyncio.session import AsyncSession

async def check_transactions():
    async with AsyncSession(engine) as session:
        # Count completed transactions with amount >= 39 (PRO or PRO+)
        stmt = select(func.count(PartnerTransaction.id)).where(PartnerTransaction.status == "completed", PartnerTransaction.amount >= 38.0)
        res = await session.exec(stmt)
        tx_count = res.one()
        
        # Breakdown by currency
        stmt_curr = select(PartnerTransaction.currency, func.count(PartnerTransaction.id)).where(PartnerTransaction.status == "completed", PartnerTransaction.amount >= 38.0).group_by(PartnerTransaction.currency)
        res_curr = await session.exec(stmt_curr)
        curr_breakdown = res_curr.all()
        
        print(f"Total completed transactions (>= $38): {tx_count}")
        for curr, count in curr_breakdown:
            print(f"  - {curr}: {count}")

if __name__ == "__main__":
    asyncio.run(check_transactions())
