
import asyncio
from sqlmodel import select
from app.models.partner import Partner, engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

async def main():
    async_session = sessionmaker(engine, class_=AsyncSession)
    async with async_session() as s:
        res = await s.exec(select(Partner).order_by(Partner.id))
        users = res.all()
        for u in users:
            print(f"{u.id}|{u.first_name}|{u.username}|{u.photo_url}")

if __name__ == "__main__":
    asyncio.run(main())
