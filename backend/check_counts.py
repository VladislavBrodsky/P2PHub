
import asyncio
from sqlmodel import select, func
from app.models.partner import Partner, engine
from sqlmodel.ext.asyncio.session import AsyncSession

async def check_pro_counts():
    async with AsyncSession(engine) as session:
        # Count all PRO partners who are PRO but not PRO+
        stmt = select(func.count(Partner.id)).where(Partner.is_pro == True, Partner.subscription_plan == "PRO_MONTHLY")
        res = await session.exec(stmt)
        pro_count = res.one()
        
        # Count PRO+ partners
        stmt_plus = select(func.count(Partner.id)).where(Partner.is_pro == True, Partner.subscription_plan == "PRO_PLUS_MONTHLY")
        res_plus = await session.exec(stmt_plus)
        pro_plus_count = res_plus.one()
        
        print(f"Current PRO partners: {pro_count}")
        print(f"Current PRO+ partners: {pro_plus_count}")

if __name__ == "__main__":
    asyncio.run(check_pro_counts())
