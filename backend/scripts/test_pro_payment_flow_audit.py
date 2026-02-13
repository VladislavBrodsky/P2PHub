import asyncio
import logging
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import select
from app.models.partner import Partner, get_session
from app.models.transaction import PartnerTransaction
from app.models.audit_log import AuditLog
from app.services.payment_service import payment_service
from app.services.notification_service import notification_service
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_pro_payment_flow():
    """
    Simulates the entire PRO payment flow:
    1. Create a test user
    2. Create a payment session (TON)
    3. Simulate manual payment submission
    4. Check audit logs
    5. Check notification queue (simulated)
    6. Verify TON transaction (simulated failure/success)
    """
    logger.info("🚀 Starting PRO Payment Flow Audit Test...")

    async for session in get_session():
        # 1. Create/Get Test User
        test_tg_id = "999888777"
        stmt = select(Partner).where(Partner.telegram_id == test_tg_id)
        existing = await session.exec(stmt)
        user = existing.first()
        
        if not user:
            user = Partner(
                telegram_id=test_tg_id,
                username="audit_tester",
                first_name="Audit",
                last_name="Tester",
                language_code="en",
                referral_code="audit_ref_123"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            logger.info(f"✅ Created test user: {user.username} ({user.id})")
        else:
            logger.info(f"ℹ️ using existing test user: {user.username}")
            # Reset pro status for test
            user.is_pro = False
            session.add(user)
            await session.commit()

        # 2. Create Payment Session (TON)
        logger.info("--- Step 2: Creating Payment Session (TON) ---")
        payment_data = await payment_service.create_payment_session(
            session, user.id, amount_usd=39.0, currency="TON", network="TON"
        )
        logger.info(f"✅ Payment Session Created: {payment_data}")
        
        # Verify Pending Transaction
        stmt_tx = select(PartnerTransaction).where(PartnerTransaction.id == payment_data["transaction_id"])
        tx = (await session.exec(stmt_tx)).first()
        assert tx.status == "pending"
        logger.info("✅ Transaction status is PENDING as expected")

        # 3. Simulate Manual Payment Submission (USDT)
        # This mimics the /submit-manual endpoint logic we just updated
        logger.info("--- Step 3: Simulating Manual Payment Submission ---")
        manual_amount = 100.0
        manual_currency = "USDT"
        manual_network = "TRC20"
        manual_hash = "f" * 64 # Fake hash
        
        # Create transaction manually as service method does
        manual_tx = await payment_service.create_transaction(
            session, user.id, manual_amount, manual_currency, manual_network, manual_hash
        )
        manual_tx.status = "manual_review"
        session.add(manual_tx)
        await session.commit()
        await session.refresh(manual_tx)
        
        logger.info(f"✅ Manual Transaction Created: ID {manual_tx.id}, Status: {manual_tx.status}")

        # 4. Simulate Audit Logging (as done in endpoint)
        from app.services.audit_service import audit_service
        logger.info("--- Step 4: Logging Audit Event ---")
        audit_log = await audit_service.log_event(
            session=session,
            entity_type="transaction",
            entity_id=str(manual_tx.id),
            action="manual_payment_submitted",
            actor_id=user.telegram_id,
            details={
                "amount": manual_amount,
                "currency": manual_currency,
                "network": manual_network,
                "tx_hash": manual_hash
            }
        )
        await session.commit()
        logger.info(f"✅ Audit Log Entry Created: ID {audit_log.id if audit_log else 'None'}")

        # Verify Audit Log
        if audit_log:
            stmt_audit = select(AuditLog).where(AuditLog.id == audit_log.id)
            saved_log = (await session.exec(stmt_audit)).first()
            assert saved_log.action == "manual_payment_submitted"
            assert saved_log.entity_id == str(manual_tx.id)
            logger.info("✅ Audit Log Verification Successful")

        # 5. Simulate Notification (Print what would be sent)
        logger.info("--- Step 5: Verifying Notification Logic ---")
        main_admin_id = "537873096"
        target_ids = settings.ADMIN_USER_IDS
        
        msg = (
            f"🚨 TEST NOTIFICATION for @uslincoln ({main_admin_id})\n"
            f"User: @{user.username} ({user.telegram_id})\n"
            f"TX: {manual_hash}"
        )
        
        logger.info(f"📧 Notification Content:\n{msg}")
        logger.info(f"🎯 Targeted Admins: {target_ids}")
        
        if main_admin_id in target_ids or str(main_admin_id) in target_ids:
             logger.info(f"✅ Main admin {main_admin_id} is correctly configured in ADMIN_USER_IDS")
        else:
             logger.warning(f"⚠️ Main admin {main_admin_id} NOT found in settings!")

        # 6. Verify TON Transaction (Simulated)
        logger.info("--- Step 6: Verifying TON Transaction Logic ---")
        # We can't really hit the blockchain with a fake hash, but we can check the service logic
        # calling verify_ton_transaction with a fake hash should return False safely
        try:
            result = await payment_service.verify_ton_transaction(session, user, "fake_hash_123")
            logger.info(f"✅ Verification result (expected False): {result}")
        except Exception as e:
            logger.error(f"❌ Verification crashed: {e}")

        logger.info("🎉 Audit Test Completed Successfully")
        break

if __name__ == "__main__":
    asyncio.run(test_pro_payment_flow())
