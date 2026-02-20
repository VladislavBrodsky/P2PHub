
import asyncio
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import sessionmaker
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner, engine, XPTransaction


async def audit_user_stats(telegram_id: str):
    """
    Diagnostic script for a single user to verify all stats against history.
    """
    print(f"🔍 Auditing stats for User {telegram_id}...")
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 1. Fetch Partner
        stmt = select(Partner).where(Partner.telegram_id == telegram_id)
        partner = (await session.exec(stmt)).first()
        
        if not partner:
            print(f"❌ User {telegram_id} not found.")
            return

        print(f"\n--- Current DB State ---")
        print(f"Username: {partner.username}")
        print(f"XP: {partner.xp}")
        print(f"Level: {partner.level}")
        print(f"Referral Count (Stored): {partner.referral_count}")
        print(f"Balance: {partner.balance}")

        # 2. Verify XP from History
        stmt_xp = select(func.sum(XPTransaction.amount)).where(XPTransaction.partner_id == partner.id)
        calc_xp = (await session.exec(stmt_xp)).one() or 0.0
        
        print(f"\n--- History Analysis ---")
        print(f"Calculated XP (Sum of Txs): {calc_xp}")
        if partner.xp != calc_xp:
            print(f"⚠️ XP MISMATCH! Drift: {partner.xp - calc_xp}")
        else:
            print(f"✅ XP is consistent.")

        # 3. Verify Referrals (Direct)
        stmt_ref = select(func.count(Partner.id)).where(Partner.referrer_id == partner.id)
        direct_count = (await session.exec(stmt_ref)).one() or 0
        print(f"Direct Referrals (L1): {direct_count}")

        # 4. Verify Total Network (L1-L20)
        from app.services.analytics_service import get_referral_tree_stats
        tree_stats = await get_referral_tree_stats(session, partner.id)
        total_network = sum(tree_stats.values())
        print(f"Total Network Size (L1-L20): {total_network}")
        
        if partner.referral_count == direct_count:
            print(f"ℹ️ referral_count matches Direct count (L1).")
        elif partner.referral_count == total_network:
            print(f"ℹ️ referral_count matches Total Network (L1-L20).")
        else:
            print(f"⚠️ referral_count ({partner.referral_count}) is inconsistent with both!")

        # 5. Verify Level
        from app.utils.ranking import get_level
        correct_level = get_level(partner.xp)
        if partner.level != correct_level:
            print(f"⚠️ Level mismatch! Stored: {partner.level}, Expected: {correct_level}")
        else:
            print(f"✅ Level is correct.")

async def main():
    if len(sys.argv) < 2:
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            # Find someone with referrals
            res = await session.exec(select(Partner).where(Partner.referral_count > 0).limit(1))
            p = res.first()
            if not p:
                res = await session.exec(select(Partner).limit(1))
                p = res.first()
            tid = p.telegram_id if p else None
        
        if not tid:
            print("No partners found in DB.")
            return
        await audit_user_stats(tid)
    else:
        await audit_user_stats(sys.argv[1])

if __name__ == "__main__":
    asyncio.run(main())
