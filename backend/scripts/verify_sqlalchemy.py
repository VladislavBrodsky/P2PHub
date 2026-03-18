import asyncio
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import Partner, get_session
from sqlmodel import select

async def check():
    print("Checking partner data...")
    count = 0
    try:
        async for session in get_session():
            stmt = select(Partner).limit(20)
            res = await session.exec(stmt)
            partners = res.all()
            if not partners:
                print("No partners found in the first 20 records.")
            for p in partners:
                print(f"ID: {p.id}, TG: {p.telegram_id}, Path: {p.path}, Depth: {p.depth}, Referrer: {p.referrer_id}, XP: {p.xp}, Balance: {p.balance}")
                count += 1
            
            # Check total count
            from sqlalchemy import func
            stmt_count = select(func.count()).select_from(Partner)
            res_count = await session.execute(stmt_count)
            total = res_count.scalar()
            print(f"Total partners in DB: {total}")
            break
    except Exception as e:
        print(f"Error during check: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check())
