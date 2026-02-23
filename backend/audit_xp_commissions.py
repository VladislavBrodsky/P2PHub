import asyncio
from sqlalchemy import func
from sqlmodel import select
from app.models.partner import engine, Partner, XPTransaction, Earning
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def audit_xp_commissions():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        print("--- XP & COMMISSION INTEGRITY AUDIT ---")
        
        # 1. Negative Values Check
        neg_bal_stmt = select(Partner).where(Partner.balance < 0)
        neg_bal_partners = (await session.execute(neg_bal_stmt)).scalars().all()
        if neg_bal_partners:
            print(f"❌ Found {len(neg_bal_partners)} partners with NEGATIVE BALANCE!")
            for p in neg_bal_partners:
                print(f"  - ID: {p.id}, Balance: {p.balance}")
        else:
            print("✅ No negative balances found.")

        neg_xp_stmt = select(Partner).where(Partner.xp < 0)
        neg_xp_partners = (await session.execute(neg_xp_stmt)).scalars().all()
        if neg_xp_partners:
            print(f"❌ Found {len(neg_xp_partners)} partners with NEGATIVE XP!")
            for p in neg_xp_partners:
                print(f"  - ID: {p.id}, XP: {p.xp}")
        else:
            print("✅ No negative XP found.")

        # 2. Reconcile Balance with Earnings
        print("\nReconciling Balances with Earnings...")
        earnings_sum_stmt = select(Earning.partner_id, func.sum(Earning.amount)).where(Earning.currency == "USDT").group_by(Earning.partner_id)
        earnings_sums = (await session.execute(earnings_sum_stmt)).all()
        earnings_map = {row[0]: row[1] for row in earnings_sums}
        
        mismatched_balances = []
        for p_id, total_earned in earnings_map.items():
            partner = await session.get(Partner, p_id)
            if partner:
                # Assuming balance is cumulative total_earned minus withdrawals (if any)
                # But here balance often equals total_earned if no withdrawals implemented or handled differently
                # Let's check for significant deviations
                if abs(partner.balance - total_earned) > 0.01:
                    mismatched_balances.append((p_id, partner.balance, total_earned))
        
        if mismatched_balances:
            print(f"⚠️ Found {len(mismatched_balances)} partners with balance/earning mismatch:")
            for p_id, bal, earn in mismatched_balances[:10]:
                print(f"  - ID: {p_id}, Balance: {bal}, Total Earned: {earn}")
            if len(mismatched_balances) > 10:
                print(f"  ... and {len(mismatched_balances) - 10} more.")
        else:
            print("✅ All balances reconcile with USDT earnings.")

        # 3. Reconcile XP with XPTransactions
        print("\nReconciling XP with XPTransactions...")
        xp_tx_sum_stmt = select(XPTransaction.partner_id, func.sum(XPTransaction.amount)).group_by(XPTransaction.partner_id)
        xp_tx_sums = (await session.execute(xp_tx_sum_stmt)).all()
        xp_tx_map = {row[0]: row[1] for row in xp_tx_sums}
        
        mismatched_xp = []
        for p_id, total_xp in xp_tx_map.items():
            partner = await session.get(Partner, p_id)
            if partner:
                if abs(partner.xp - total_xp) > 0.1:
                    mismatched_xp.append((p_id, partner.xp, total_xp))
        
        if mismatched_xp:
            print(f"⚠️ Found {len(mismatched_xp)} partners with XP/Transaction mismatch:")
            for p_id, xp, tx_xp in mismatched_xp[:10]:
                print(f"  - ID: {p_id}, XP: {xp}, Total TX XP: {tx_xp}")
            if len(mismatched_xp) > 10:
                print(f"  ... and {len(mismatched_xp) - 10} more.")
        else:
            print("✅ All XP totals reconcile with XPTransactions.")

        # 4. Anomalously high values
        print("\nChecking for anomalously high values...")
        high_xp_stmt = select(Partner).where(Partner.xp > 50000)
        high_xp_partners = (await session.execute(high_xp_stmt)).scalars().all()
        if high_xp_partners:
            print(f"⚠️ Found {len(high_xp_partners)} partners with > 50,000 XP.")
        
        high_bal_stmt = select(Partner).where(Partner.balance > 1000)
        high_bal_partners = (await session.execute(high_bal_stmt)).scalars().all()
        if high_bal_partners:
            print(f"⚠️ Found {len(high_bal_partners)} partners with > 1,000 USDT balance.")

        # 5. Check for compression leaks (earnings to admin)
        admin_ids = [str(x) for x in [716720099, 537873096]] # Common admin IDs
        leak_stmt = select(func.sum(Earning.amount)).where(
            Earning.description.like("%Compression Leakage%"),
            Partner.telegram_id.in_(admin_ids),
            Earning.partner_id == Partner.id
        )
        total_leak = (await session.execute(leak_stmt)).scalar() or 0
        print(f"\nTotal Commissions Leaked to Admin: {total_leak} USDT")

if __name__ == "__main__":
    asyncio.run(audit_xp_commissions())
