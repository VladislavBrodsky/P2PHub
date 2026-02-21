
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker
from app.services.referral_service import distribute_pro_commissions, process_referral_logic
from app.models.notification_retry import NotificationRetry

async def run_l20_test():
    async with async_session_maker() as session:
        # 1. Fetch @uslincoln
        uslincoln = await session.get(Partner, 1) # assuming ID 1 based on previous output
        if not uslincoln:
            stmt = select(Partner).where(Partner.telegram_id == '716720099')
            uslincoln = (await session.exec(stmt)).first()
            
        print(f"✅ Found Leader: {uslincoln.username} (ID: {uslincoln.id})")
        
        # 2. Cleanup old test users
        stmt = select(Partner).where(Partner.telegram_id.startswith('888000'))
        old_tests = (await session.exec(stmt)).all()
        for ot in old_tests:
            await session.delete(ot)
        stmt2 = select(Partner).where(Partner.telegram_id.startswith('test_tg_'))
        for ot in (await session.exec(stmt2)).all():
            await session.delete(ot)
        await session.commit()
        
        # 3. Create L1 to L19 Dummies
        parent = uslincoln
        dummies = []
        for i in range(1, 20):  # i = 1 means L1, 19 means L19
            path = f"{parent.path or ''}.{parent.id}".lstrip(".")
            depth = parent.depth + 1
            dummy = Partner(
                telegram_id=f"888000{i:02d}",
                username=f"l20_dummy_{i}",
                first_name=f"Dummy {i}",
                referral_code=f"DUMMY-{i}",
                referrer_id=parent.id,
                path=path,
                depth=depth
            )
            session.add(dummy)
            await session.commit()
            await session.refresh(dummy)
            dummies.append(dummy)
            parent = dummy
            
        print(f"✅ Created 19 Deep Dummy Users under {uslincoln.username}")
        
        # 4. Create Sarah (L20)
        path = f"{parent.path or ''}.{parent.id}".lstrip(".")
        depth = parent.depth + 1
        sarah = Partner(
            telegram_id="88800020",
            username="sjenkins__l20",
            first_name="Sarah",
            last_name="Jenkins",
            referral_code="SARAH-20",
            referrer_id=parent.id,
            path=path,
            depth=depth
        )
        session.add(sarah)
        await session.commit()
        await session.refresh(sarah)
        print(f"✅ Created Target Target: {sarah.first_name} at L20 (ID: {sarah.id})")
        
        # 5. Process Referral Logic (XP Distribution up to L20)
        print("🔄 Processing Referral Deep Expansion XP (L1-L20)...")
        await process_referral_logic(sarah.id)
        
        # 6. Simulate PRO Purchase ($39)
        print("💸 Simulating $39 PRO Purchase (TON) by Sarah Jenkins...")
        await distribute_pro_commissions(session, sarah.id, 39.0, plan_type="PRO_YEARLY", transaction_id=12345678)
        await session.commit()
        
        # 7. Audit Results
        print("\n=== AUDIT: REFERRAL XP ===")
        stmt = select(Earning).where(
            Earning.reference_id.like(f"ref_xp_{sarah.id}_%")
        ).order_by(Earning.created_at.desc())
        xps = (await session.exec(stmt)).all()
        for xp in xps:
            rx = await session.get(Partner, xp.partner_id)
            print(f"XP: {rx.username} got {xp.amount} {xp.currency}")
            
        print("\n=== AUDIT: PRO COMMISSIONS ($39 TON) ===")
        stmt = select(Earning).where(
            Earning.type == "COMMISSION",
            Earning.description.like("%sjenkins__l20%") # Find the dynamic description matching Sarah
        )
        # However, description matching might miss leakage...
        # Wait, leakage description is `Missed Tree Revenue: Compression Leakage (L{level} (from {buyer_id}))`
        # and standard commission is `Commission... (from {buyer})`
        stmt_comm = select(Earning).where(
            Earning.type == "COMMISSION",
            Earning.created_at >= sarah.created_at
        )
        comms = (await session.exec(stmt_comm)).all()
        for c in comms:
            if 'Missed Tree' in c.description and str(sarah.id) in c.description:
                rx = await session.get(Partner, c.partner_id)
                print(f"LEAKAGE: {rx.username} rescued {c.amount} USDT (desc: {c.description})")
            elif 'sjenkins' in c.description or 'Sarah' in c.description:
                rx = await session.get(Partner, c.partner_id)
                print(f"COMMISSION: {rx.username} earned {c.amount} USDT (desc: {c.description})")
                
        # 8. Audit Notifications Queue
        print("\n=== AUDIT: NOTIFICATIONS GENERATED ===")
        user_ids = [str(uslincoln.telegram_id), "88800019"]
        stmt_notif = select(NotificationRetry).where(NotificationRetry.chat_id.in_(user_ids))
        notifs = (await session.exec(stmt_notif)).all()
        for n in notifs:
            print(f"Chat ID: {n.chat_id} -> Status: {n.status} | Snippet: {n.text[:60]}...")
            
if __name__ == "__main__":
    asyncio.run(run_l20_test())
