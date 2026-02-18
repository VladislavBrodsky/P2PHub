
import asyncio
from sqlmodel import select, func
from app.models.partner import Partner, engine
from sqlmodel.ext.asyncio.session import AsyncSession

async def check_pro_counts():
    async with AsyncSession(engine) as session:
        # Total is_pro
        stmt_total = select(func.count(Partner.id)).where(Partner.is_pro == True)
        res_total = await session.exec(stmt_total)
        total_pro = res_total.one()
        
        # Breakdown by plan
        stmt_plans = select(Partner.subscription_plan, func.count(Partner.id)).where(Partner.is_pro == True).group_by(Partner.subscription_plan)
        res_plans = await session.exec(stmt_plans)
        plans = res_plans.all()
        
        print(f"Total is_pro=True: {total_pro}")
        print("Breakdown by subscription_plan:")
        for plan, count in plans:
            print(f"  - {plan}: {count}")

if __name__ == "__main__":
    asyncio.run(check_pro_counts())
