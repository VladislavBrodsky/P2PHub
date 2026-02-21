
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker

async def find_users():
    async with async_session_maker() as session:
        usernames = ["pintopayhelp", "uslincoln", "Rudskixx_Dmitry854"]
        for un in usernames:
            u = (await session.exec(select(Partner).where(Partner.username == un))).first()
            if u:
                print(f"✅ {un}: {u.telegram_id}")
            else:
                print(f"❌ {un}: Not found")

if __name__ == "__main__":
    asyncio.run(find_users())
