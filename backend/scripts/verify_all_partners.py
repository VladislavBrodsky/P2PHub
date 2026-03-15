import asyncio
from sqlmodel import select, func
from app.models.partner import Partner, XPTransaction, Earning, get_session
from app.core.config import settings

async def verify_reconciliation():
    async for session in get_session():
        # Fetch all partners
        stmt = select(Partner)
        res = await session.exec(stmt)
        partners = res.all()
        
        print(f"Verifying {len(partners)} partners...")
        discrepancies = 0
        
        for partner in partners:
            # 1. Total XP from Ledger
            stmt_xp = select(func.sum(XPTransaction.amount)).where(XPTransaction.partner_id == partner.id)
            res_xp = await session.exec(stmt_xp)
            expected_xp = res_xp.first() or 0.0
            
            # 2. Total USDT Earnings (and payments) from Ledger
            stmt_usdt = select(func.sum(Earning.amount)).where(Earning.partner_id == partner.id, Earning.currency == "USDT")
            res_usdt = await session.exec(stmt_usdt)
            expected_usdt = res_usdt.first() or 0.0
            
            xp_diff = abs(float(partner.xp) - float(expected_xp))
            usdt_diff = abs(float(partner.balance) - float(expected_usdt))
            
            if xp_diff > 0.01 or usdt_diff > 0.01:
                print(f"❌ DISCREPANCY: Partner {partner.telegram_id}")
                if xp_diff > 0.01:
                    print(f"   XP: Actual={partner.xp}, Ledger={expected_xp}, Diff={partner.xp - expected_xp}")
                if usdt_diff > 0.01:
                    print(f"   USDT: Actual={partner.balance}, Ledger={expected_usdt}, Diff={partner.balance - expected_usdt}")
                discrepancies += 1
        
        if discrepancies == 0:
            print("✅ ALL PARTNERS ARE RECONCILED AND HEALTHY.")
        else:
            print(f"⚠️ FOUND {discrepancies} PARTNERS WITH ONGOING DISCREPANCIES.")

if __name__ == "__main__":
    asyncio.run(verify_reconciliation())
