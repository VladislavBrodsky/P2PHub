
import asyncio
import logging
import os
import sys

# Setting up the path to include the backend directory
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlmodel import delete, select

from app.models.partner import Partner, SystemSetting, get_session
from app.models.transaction import PartnerTransaction
from app.services.admin_service import admin_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def audit_admin_stats():
    """
    Simulates a PRO_LIFETIME (PRO+) sale and checks if Admin Stats update correctly.
    """
    logger.info("--- Starting Admin Stats Audit ---")

    async for session in get_session():
        # 1. Get Initial Stats
        initial_stats = await admin_service.get_dashboard_stats(force_refresh=True)
        initial_slots = initial_stats["performance"]["pro_slots_display"]
        initial_revenue = initial_stats["financials"]["total_revenue"]
        
        logger.info(f"Initial Slots Sold: {initial_slots}")
        logger.info(f"Initial Total Revenue: ${initial_revenue}")

        # 2. Simulate User & PRO+ Purchase
        # Create a dummy user
        test_user = Partner(
            telegram_id="999999999",
            username="audit_test_user",
            first_name="Audit",
            last_name="Test",
            is_pro=False,
            level=1,
            xp=0,
            balance=0.0
        )
        session.add(test_user)
        await session.commit()
        await session.refresh(test_user)
        
        logger.info(f"Created test user: ID {test_user.id}")

        # Create a fulfilled PRO+ transaction ($69)
        test_tx = PartnerTransaction(
            partner_id=test_user.id,
            amount=69.0,
            currency="USDT",
            network="TRC20",
            status="completed", # Completed instantly for test
            tx_hash="audit_test_hash_123"
        )
        session.add(test_tx)
        
        # Update User Status to PRO_LIFETIME (which triggers the slot counter logic)
        test_user.is_pro = True
        test_user.subscription_plan = "PRO_LIFETIME"
        session.add(test_user)
        
        await session.commit()
        logger.info("Simulated PRO+ Purchase ($69) and subscription activation.")

        # 3. Get Updated Stats
        # We must force refresh to bypass cache
        updated_stats = await admin_service.get_dashboard_stats(force_refresh=True)
        updated_slots = updated_stats["performance"]["pro_slots_display"]
        updated_revenue = updated_stats["financials"]["total_revenue"]
        
        logger.info(f"Updated Slots Sold: {updated_slots}")
        logger.info(f"Updated Total Revenue: ${updated_revenue}")

        # 4. Assertions
        # Slots should increase by 1
        if updated_slots == initial_slots + 1:
            logger.info("✅ SUCCESS: PRO Slots counter increased by 1.")
        else:
            logger.error(f"❌ FAILURE: PRO Slots counter did not increase correctly. Expected {initial_slots + 1}, got {updated_slots}")

        # Revenue should increase by 69
        if abs(updated_revenue - (initial_revenue + 69.0)) < 0.1:
            logger.info("✅ SUCCESS: Total Revenue increased by $69.00.")
        else:
            logger.error(f"❌ FAILURE: Revenue mismatch. Expected {initial_revenue + 69.0}, got {updated_revenue}")

        # 5. Cleanup
        logger.info("Cleaning up test data...")
        await session.delete(test_tx)
        await session.delete(test_user)
        
        # Revert the system setting count so we don't mess up production stats permanently
        # The logic in admin_service auto-increments if it sees more users, but doesn't decrement easily.
        # We will manually reset it to initial_slots for this test.
        setting = await session.exec(select(SystemSetting).where(SystemSetting.key == "pro_slots_sold"))
        setting_obj = setting.first()
        if setting_obj:
            setting_obj.value = str(initial_slots)
            session.add(setting_obj)
            
        await session.commit()
        logger.info("Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(audit_admin_stats())
