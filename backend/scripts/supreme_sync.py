import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import os
import sys
from datetime import datetime

# Add backend to path

import contextlib

from sqlalchemy.orm import sessionmaker
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner, XPTransaction, engine
from app.services.redis_service import redis_service
from app.utils.ranking import get_level


async def reconcile_all_partners():
    """
    The Ultimate Reconciliation Script.
    Ensures every partner's stats (Referrals, XP, Level) are based on primary data.
    """
    print(f"🚀 Starting Supreme Reconciliation [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # 1. Fetch all partners
        statement = select(Partner)
        result = await session.exec(statement)
        partners = result.all()
        
        total_partners = len(partners)
        print(f"📊 Analyzing {total_partners} partners for sync...")
        
        updated_count = 0
        
        for partner in partners:
            needs_update = False
            
            # --- A. Recalculate Direct Referrals (L1) ---
            count_stmt = select(func.count()).where(Partner.referrer_id == partner.id)
            actual_ref_count = (await session.exec(count_stmt)).one()
            
            if partner.referral_count != actual_ref_count:
                # Only print major discrepancies to avoid terminal log flooding
                if abs(partner.referral_count - actual_ref_count) > 0:
                     print(f"  [REF] {partner.telegram_id}: {partner.referral_count} -> {actual_ref_count}")
                partner.referral_count = actual_ref_count
                needs_update = True
                
            # --- B. Recalculate XP from History ---
            xp_stmt = select(func.sum(XPTransaction.amount)).where(XPTransaction.partner_id == partner.id)
            actual_xp = (await session.exec(xp_stmt)).one() or 0.0
            
            if abs(partner.xp - actual_xp) > 0.01:
                print(f"  [XP]  {partner.telegram_id}: {partner.xp} -> {actual_xp}")
                partner.xp = actual_xp
                needs_update = True
                
            # --- C. Recalculate Level ---
            correct_level = get_level(partner.xp)
            if partner.level != correct_level:
                print(f"  [LVL] {partner.telegram_id}: {partner.level} -> {correct_level}")
                partner.level = correct_level
                needs_update = True
                
            if needs_update:
                session.add(partner)
                updated_count += 1
                
                # Invalidate profile cache
                with contextlib.suppress(BaseException):
                    await redis_service.client.delete(f"partner:profile:{partner.telegram_id}")
            
            # Periodically commit and log progress
            if updated_count > 0 and updated_count % 100 == 0:
                await session.commit()
                print(f"  💾 Partial commit: {updated_count} partners updated...")

        if updated_count > 0:
            await session.commit()
            print(f"✅ Reconciliation complete. Updated {updated_count} partners.")
        else:
            print("✅ All systems in sync. No discrepancies found.")

if __name__ == "__main__":
    if "backend" not in os.getcwd():
        print("❌ Error: Run from project root with: export PYTHONPATH=backend && python3 backend/scripts/supreme_sync.py")
        sys.exit(1)
        
    asyncio.run(reconcile_all_partners())
