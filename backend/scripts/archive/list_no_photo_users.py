import asyncio
from sqlmodel import select
from app.models.partner import Partner, engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

async def main():
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as s:
        res = await s.exec(select(Partner).where(Partner.photo_url.is_(None)))
        users = res.all()
        for u in users:
            print(f"{u.id}|{u.first_name}|{u.username}")

if __name__ == "__main__":
    asyncio.run(main())
