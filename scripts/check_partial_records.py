
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.referral_service import process_referral_logic

async def check():
    for user_id in [286, 287, 283, 284, 285]:
        print(f"Triggering logic for {user_id}...")
        try:
            # We don't check idempotency if we want to force? Wait, idempotency will block it.
            # Let's see if idempotency blocks it.
            pass
        except Exception as e:
            pass

    from sqlmodel import select
    from app.models.partner import Partner, async_session_maker, XPTransaction, Earning
    async with async_session_maker() as session:
        for user_id in [286, 287, 283, 284, 285]:
            p = await session.get(Partner, user_id)
            if not p: continue
            
            stmt = select(XPTransaction).where(
                XPTransaction.reference_id == str(p.id),
                XPTransaction.type.in_(["REFERRAL_L1", "REFERRAL_DEEP", "REFERRAL_SIGNUP"])
            )
            awarded_xp = (await session.exec(stmt)).all()
            print(f"User {user_id} XP Transactions found: {len(awarded_xp)}")
            for tx in awarded_xp:
                print(f"   [XP] Partner {tx.partner_id} gained {tx.amount} XP")
                
            stmt2 = select(Earning).where(Earning.reference_id.like(f"ref_xp_{p.id}_%"))
            earns = (await session.exec(stmt2)).all()
            print(f"User {user_id} Earning Transactions found: {len(earns)}")
            for e in earns:
                print(f"   [Earn] Partner {e.partner_id} gained {e.amount} {e.currency}")

if __name__ == "__main__":
    asyncio.run(check())
