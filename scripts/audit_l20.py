
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker
from app.models.notification_retry import NotificationRetry

async def audit():
    async with async_session_maker() as session:
        # Get Sarah
        stmt = select(Partner).where(Partner.telegram_id == '88800020')
        sarah = (await session.exec(stmt)).first()
        if not sarah:
            print("Sarah not found!")
            return
            
        print("\n=== AUDIT: REFERRAL XP ===")
        stmt = select(Earning).where(
            Earning.reference_id.like(f"ref_xp_{sarah.id}_%")
        ).order_by(Earning.created_at.desc())
        xps = (await session.exec(stmt)).all()
        for xp in xps:
            rx = await session.get(Partner, xp.partner_id)
            print(f"XP: {rx.username} got {xp.amount} {xp.currency} | Desc: {xp.description}")
            
        print("\n=== AUDIT: PRO COMMISSIONS ($39 TON) ===")
        stmt_comm = select(Earning).where(
            Earning.type == "COMMISSION",
            Earning.created_at >= sarah.created_at
        ).order_by(Earning.created_at.desc())
        comms = (await session.exec(stmt_comm)).all()
        for c in comms:
            if str(sarah.id) in c.description or 'sjenkins' in c.description or 'Sarah' in c.description:
                rx = await session.get(Partner, c.partner_id)
                prefix = "LEAKAGE (Roll-up)" if "Missed Tree" in c.description else "COMMISSION"
                print(f"{prefix}: {rx.username} earned {c.amount} USDT (desc: {c.description})")
                
        print("\n=== AUDIT: PENDING RETRYS / NOTIFICATIONS ===")
        stmt_notif = select(NotificationRetry).where(NotificationRetry.chat_id.in_(["716720099", "88800019"])).order_by(NotificationRetry.created_at.desc())
        notifs = (await session.exec(stmt_notif)).all()
        for n in notifs[:5]:
            print(f"Chat ID: {n.chat_id} -> Status: {n.status} | Snippet: {n.text[:80]}")

if __name__ == "__main__":
    asyncio.run(audit())
