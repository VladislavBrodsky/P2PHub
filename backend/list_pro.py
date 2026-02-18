
import asyncio
from sqlmodel import select
from app.models.partner import Partner, engine
from sqlmodel.ext.asyncio.session import AsyncSession

async def run():
    async with AsyncSession(engine) as session:
        res = await session.exec(select(Partner).where(Partner.is_pro == True))
        partners = res.all()
        print(f"Total PRO partners: {len(partners)}")
        for p in partners:
            print(f"ID: {p.id}, Plan: {p.subscription_plan}, Expires: {p.pro_expires_at}")

if __name__ == "__main__":
    asyncio.run(run())
