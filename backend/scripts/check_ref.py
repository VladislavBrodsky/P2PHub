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
        stmt = select(Partner).where(Partner.username == 'Rudskixx_Dmitry854')
        user = (await session.exec(stmt)).first()
        if user:
            print(f"User: @{user.username} (ID: {user.id}, TG: {user.telegram_id})")
            if user.referrer_id:
                ref = await session.get(Partner, user.referrer_id)
                print(f"Referrer: @{ref.username} (ID: {ref.id}, TG: {ref.telegram_id})")
            else:
                print("No Referrer")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check())
