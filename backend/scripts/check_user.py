import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from sqlmodel import select
from app.models.partner import Partner, get_session

async def check_user(username: str):
    async for session in get_session():
        stmt = select(Partner).where(Partner.username == username)
        result = await session.exec(stmt)
        partner = result.first()
        if partner:
            print(f"User: {partner.username}")
            print(f"ID: {partner.id}")
            print(f"Telegram ID: {partner.telegram_id}")
            print(f"XP: {partner.xp}")
            print(f"Balance: {partner.balance}")
            print(f"Is PRO: {partner.is_pro}")
            print(f"Subscription Plan: {partner.subscription_plan}")
            print(f"Referral Count: {partner.referral_count}")
        else:
            print(f"User {username} not found in DB.")
        break

if __name__ == "__main__":
    import sys
    username = sys.argv[1] if len(sys.argv) > 1 else "uslincoln"
    asyncio.run(check_user(username))
