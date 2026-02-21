import asyncio
import os
import sys

# Bootstrap
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import scripts._bootstrap  # noqa

from sqlmodel import select
from app.models.partner import Partner, async_session_maker

async def check():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.telegram_id.in_(['716720099', '537873096']))
        res = await session.exec(stmt)
        for p in res.all():
            print(f"User: @{p.username} (ID: {p.id}, TG: {p.telegram_id})")

if __name__ == "__main__":
    asyncio.run(check())
