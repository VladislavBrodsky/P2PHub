import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio

from sqlmodel import func, select

from app.models.partner import Partner, get_session


async def check_pro_distribution():
    async for session in get_session():
        stmt = select(Partner.subscription_plan, func.count(Partner.id)).where(Partner.is_pro).group_by(Partner.subscription_plan)
        res = await session.exec(stmt)
        for plan, count in res.all():
            print(f"Plan: {plan}, Count: {count}")

if __name__ == "__main__":
    asyncio.run(check_pro_distribution())
