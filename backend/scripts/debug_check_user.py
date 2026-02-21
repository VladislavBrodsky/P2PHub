import asyncio
import os
import sys

# Bootstrap
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import scripts._bootstrap  # noqa

from sqlmodel import select
from app.models.partner import Partner, async_session_maker

async def check_user(username: str):
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username == username)
        user = (await session.exec(stmt)).first()
        if user:
            print(f"FOUND: ID={user.id}, TG={user.telegram_id}, PLAN={user.subscription_plan}, IS_PRO={user.is_pro}")
        else:
            print("NOT_FOUND")

if __name__ == "__main__":
    asyncio.run(check_user("Rudskixx_Dmitry854"))
