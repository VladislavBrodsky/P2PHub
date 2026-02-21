import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker

async def check():
    async with async_session_maker() as session:
        u = await session.get(Partner, 1)
        print(f"is_pro: {u.is_pro}")
        print(f"subscription_plan: '{u.subscription_plan}'")
        print(f"is_pro_plus: {u.is_pro_plus}")

if __name__ == "__main__":
    asyncio.run(check())
