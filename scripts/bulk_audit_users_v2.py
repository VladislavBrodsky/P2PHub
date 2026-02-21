
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker
from app.services.rate_limit_service import rate_limit_service

async def audit_user(session, username_or_id):
    if str(username_or_id).isdigit():
        stmt = select(Partner).where(Partner.telegram_id == str(username_or_id))
    else:
        stmt = select(Partner).where(Partner.username == username_or_id.replace("@", ""))
        
    res = await session.exec(stmt)
    p = res.first()
    if not p:
        print(f"❌ User {username_or_id} not found.")
        return

    print(f"\n--- Audit for @{p.username} ({p.telegram_id}) ---")
    print(f"DB notifications_paused: {p.notifications_paused}")
    
    # Redis check
    is_blocked = await rate_limit_service.is_blocked(int(p.telegram_id))
    print(f"Redis blocked status: {is_blocked}")
    
    # Plan info
    print(f"Plan: {p.subscription_plan}")
    print(f"Is PRO: {p.is_pro}")
    print(f"Referrer ID: {p.referrer_id}")

    # If they are blocked, unblock them!
    if p.notifications_paused or is_blocked:
        print(f"🛠 Repairing notification status for {p.username}...")
        p.notifications_paused = False
        session.add(p)
        await rate_limit_service.unmark_user_blocked(int(p.telegram_id))
        print(f"✅ Repaired.")

async def main():
    users = ["716720099", "283561463", "pintopayhelp"]
    if len(sys.argv) > 1:
        users = sys.argv[1:]
    
    async with async_session_maker() as session:
        for u in users:
            await audit_user(session, u)
        await session.commit()

if __name__ == "__main__":
    asyncio.run(main())
