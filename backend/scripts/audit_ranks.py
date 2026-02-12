
import asyncio
from sqlmodel import select
from app.models.partner import Partner, engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# #comment Extended audit to find specific ranks and identify glitches.
async def main():
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as s:
        # Get top 30 to cover all requested ranks (13, 14, 15, 16, 24)
        res = await s.exec(select(Partner).order_by(Partner.xp.desc()).limit(40))
        users = res.all()
        print(f"{'Rank':<5} | {'ID':<5} | {'Name':<15} | {'Username':<15} | {'Photo':<20}")
        print("-" * 75)
        for i, u in enumerate(users):
            rank = i + 1
            print(f"{rank:<5} | {u.id:<5} | {u.first_name:<15} | {u.username:<15} | {u.photo_url or 'None'}")

if __name__ == "__main__":
    asyncio.run(main())
