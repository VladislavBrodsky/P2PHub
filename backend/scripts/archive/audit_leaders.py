
import asyncio
from sqlmodel import select
from app.models.partner import Partner, engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# #comment Audit script to identify exact Partner IDs for correcting profiles
async def main():
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as s:
        # Get top 20 by XP to match user's screenshot
        res = await s.exec(select(Partner).order_by(Partner.xp.desc()).limit(20))
        users = res.all()
        print("ID | Name | Username | XP | Photo")
        print("-" * 50)
        for u in users:
            print(f"{u.id} | {u.first_name} | {u.username} | {u.xp} | {u.photo_url}")

if __name__ == "__main__":
    asyncio.run(main())
