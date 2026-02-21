
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.referral_service import process_referral_logic

async def check():
    print("Triggering logic for 286...")
    try:
        await process_referral_logic(286)
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
