
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import async_session_maker
from app.services.referral_service import process_referral_logic

async def check():
    for user_id in [286, 287, 283, 284, 285]:
        print(f"Triggering logic for {user_id}...")
        try:
            await process_referral_logic(user_id)
            print(f"Done triggering {user_id}")
        except Exception as e:
            print(f"Error for {user_id}: {e}")

if __name__ == "__main__":
    asyncio.run(check())
