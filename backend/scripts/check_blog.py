import asyncio

from sqlmodel import func, select

from app.models.blog import BlogPost
from app.models.partner import async_session_maker


async def check():
    async with async_session_maker() as s:
        count = (await s.exec(select(func.count()).select_from(BlogPost))).one()
        print(f"COUNT: {count}")

if __name__ == "__main__":
    asyncio.run(check())
