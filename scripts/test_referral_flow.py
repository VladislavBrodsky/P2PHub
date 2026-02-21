
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker
from app.services.referral_service import distribute_pro_commissions
from app.models.audit_log import AuditLog

async def test_referral_flow(partner_tg_id: str):
    async with async_session_maker() as session:
        # Find the partner
        stmt = select(Partner).where(Partner.telegram_id == partner_tg_id)
        res = await session.exec(stmt)
        partner = res.first()
        
        if not partner:
            print(f"❌ Partner {partner_tg_id} not found.")
            return

        print(f"🚀 Triggering test commission for {partner.username or partner.telegram_id} (ID: {partner.id})...")
        
        # Test Upgrade with unique transaction ID
        import random
        test_tx_id = random.randint(9900000, 9999999)
        
        await distribute_pro_commissions(
            session=session, 
            partner_id=partner.id, 
            total_amount=39.0, 
            plan_type="PRO_LIFETIME",
            transaction_id=test_tx_id
        )
        
        # distribute_pro_commissions doesn't commit by default (it's called within payment_service)
        # So we need to commit or flush in this test script
        await session.commit()
        
        print(f"✅ Distribution complete (Tx: {test_tx_id}). Checking AuditLog for 'enqueued' events...")
        
        await asyncio.sleep(2) # Wait for async background tasks (TaskIQ enqueue)
        
        # Check AuditLog for recent 'enqueued' actions
        stmt_log = select(AuditLog).where(AuditLog.action == "enqueued").order_by(AuditLog.created_at.desc()).limit(5)
        res_log = await session.exec(stmt_log)
        logs = res_log.all()
        
        if not logs:
            print("❌ No 'enqueued' logs found. This means messages were either blocked (dedup/paused) or enqueue failed.")
        for l in logs:
            print(f"- Enqueued Audit: [{l.created_at}] To: {l.entity_id} | Details: {l.details}")

if __name__ == "__main__":
    # Test for Rudskixx_Dmitry854 (283561463)
    # Their upline should be uslincoln (716720099)
    asyncio.run(test_referral_flow("283561463"))
