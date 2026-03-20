import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(os.getcwd())

from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine

async def check_dupes():
    async with AsyncSession(engine) as session:
        # Check for duplicate TG IDs
        statement = select(Partner.telegram_id, func.count(Partner.id)).group_by(Partner.telegram_id).having(func.count(Partner.id) > 1)
        res = await session.execute(statement)
        dupes = res.all()
        
        if dupes:
            print(f"❌ FOUND {len(dupes)} DUPLICATE TG IDs!")
            for tg_id, count in dupes:
                print(f"  TG ID {tg_id}: {count} records")
        else:
            print("✅ No duplicate Telegram IDs found.")

        # Check for users with 0 referrals but entries in other tables (manual audit)
        print("\n--- AUDITING NULL PROFILES ---")
        null_statement = select(Partner).where(Partner.username.is_(None), Partner.first_name.is_(None))
        null_res = await session.exec(null_statement)
        null_users = null_res.all()
        print(f"Found {len(null_users)} users with no Names/Username.")
        for u in null_users[:5]:
            print(f"  ID: {u.id} | TG: {u.telegram_id} | Created: {u.created_at}")

if __name__ == "__main__":
    asyncio.run(check_dupes())
