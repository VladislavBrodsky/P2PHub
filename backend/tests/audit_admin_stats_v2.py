
import asyncio
import logging
import sys
import os
from sqlalchemy import delete

# Setting up the path to include the backend directory
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from app.models.partner import Partner, get_session, SystemSetting
from app.models.transaction import PartnerTransaction
from app.services.admin_service import admin_service
from app.services.payment_service import payment_service
from sqlmodel import select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def audit_admin_scenarios():
    """
    Simulates PRO and PRO+ sales scenarios to verify Admin Dashboard tracking.
    """
    logger.info("--- Starting Comprehensive Admin Audit ---")

    async for session in get_session():
        try:
            # 1. Capture Baseline
            initial_stats = await admin_service.get_dashboard_stats(force_refresh=True)
            initial_slots = initial_stats["performance"]["pro_slots_display"]
            initial_revenue = initial_stats["financials"]["total_revenue"]
            
            logger.info(f"[BASELINE] Slots Sold: {initial_slots} | Revenue: ${initial_revenue}")

            # 2. Prepare Test User (Clean Slate)
            test_user = None
            
            # 2. Cleanup Old Test Data (Handle circular dependency)
            test_tg_id = "999999999"
            
            existing_partners = (await session.exec(select(Partner).where(Partner.telegram_id == test_tg_id))).all()
            for p in existing_partners:
                p.last_transaction_id = None
                session.add(p)
            await session.commit()
            
            p_ids_start = [p.id for p in existing_partners]
            if p_ids_start:
                from app.models.partner import XPTransaction, Earning, PartnerTask
                await session.exec(delete(PartnerTransaction).where(PartnerTransaction.partner_id.in_(p_ids_start)))
                await session.exec(delete(XPTransaction).where(XPTransaction.partner_id.in_(p_ids_start)))
                await session.exec(delete(Earning).where(Earning.partner_id.in_(p_ids_start)))
                await session.exec(delete(PartnerTask).where(PartnerTask.partner_id.in_(p_ids_start)))
                
                await session.exec(delete(Partner).where(Partner.id.in_(p_ids_start)))
                await session.commit()
            
            await session.exec(delete(Partner).where(Partner.telegram_id == test_tg_id))
            await session.commit()

            test_user = Partner(
                telegram_id=test_tg_id,
                username="audit_test_user",
                first_name="Audit",
                last_name="Test",
                is_pro=False,
                level=1,
                xp=0,
                balance=0.0,
                referral_code=f"AUDIT-{test_tg_id[:8].upper()}"
            )
            session.add(test_user)
            await session.commit()
            await session.refresh(test_user)
            logger.info(f"Created test user: ID {test_user.id}")

            # 3. SCENARIO A: Standard PRO Sale ($39) -> Should Increment Limited Slots (FOMO)
            # Use PaymentService to trigger real logic
            await payment_service.upgrade_to_pro(
                session=session,
                partner=test_user,
                amount=39.0,
                currency="USDT",
                network="TRC20",
                tx_hash="audit_pro_hash_123"
            )
            
            # Verify Stats
            stats_a = await admin_service.get_dashboard_stats(force_refresh=True)
            slots_a = stats_a["performance"]["pro_slots_display"]
            rev_a = stats_a["financials"]["total_revenue"]
            
            if slots_a == initial_slots + 1:
                logger.info("✅ PASS: Standard PRO sale incremented FOMO slots (+1).")
            else:
                logger.error(f"❌ FAIL: Standard PRO sale slot count mismatch. Expected {initial_slots + 1}, got {slots_a}")

            if abs(rev_a - (initial_revenue + 39.0)) < 0.1:
                logger.info("✅ PASS: Standard PRO revenue logged +$39.00.")
            else:
                logger.error(f"❌ FAIL: Revenue mismatch for PRO. Expected {initial_revenue + 39.0}, got {rev_a}")

            # 4. SCENARIO B: Upgrade to PRO+ ($69) -> Check Behavior
            # Reset user status first (simulate new purchase or upgrade)
            # PRO+ typically doesn't consume a "Lifetime Slot" in current logic because it's Monthly/Different tier
            # But let's see if revenue adds up correctly.
            
            # Note: upgrade_to_pro handles strict logic. If user is already PRO_LIFETIME, 
            # upgrading to PRO_PLUS_MONTHLY might be complex in logic, but let's test a fresh PRO+ buy.
            
            # Cleanup PRO tx to simulate fresh user again for cleaner test
            await session.exec(delete(PartnerTransaction).where(PartnerTransaction.partner_id == test_user.id))
            test_user.is_pro = False
            test_user.subscription_plan = None
            session.add(test_user)
            await session.commit()
            
            # Reset the slot counter manually to baseline for clean test
            setting = (await session.exec(select(SystemSetting).where(SystemSetting.key == "pro_slots_sold"))).first()
            if setting:
                setting.value = str(initial_slots)
                session.add(setting)
                await session.commit()

            # Execute PRO+ Buy
            await payment_service.upgrade_to_pro(
                session=session,
                partner=test_user,
                amount=69.0, # PRO+ Price triggers is_plus logic
                currency="USDT",
                network="TRC20",
                tx_hash="audit_pro_plus_hash_456"
            )

            stats_b = await admin_service.get_dashboard_stats(force_refresh=True)
            slots_b = stats_b["performance"]["pro_slots_display"] # Should NOT increment for PRO+ (based on current logic)
            rev_b = stats_b["financials"]["total_revenue"]

            # PRO+ doesn't use the Limited Lifetime Slots counter in current code
            if slots_b == initial_slots:
                logger.info("✅ PASS: PRO+ sale did NOT increment Limited Lifetime Slots (Correct behavior for separate tier).")
            else:
                logger.warning(f"⚠️ NOTE: PRO+ sale incremented slots. New count: {slots_b}. This might be intended if PRO+ also consumes slots.")

            # Revenue check (Baseline + 69)
            # Note: We reset the previous transaction, so revenue should be Initial + 69 (since we deleted the +39 tx)
            current_total_rev_in_db = (await session.exec(select(PartnerTransaction).where(PartnerTransaction.status == "completed"))).all()
            calc_rev = sum([t.amount for t in current_total_rev_in_db])
            
            if abs(rev_b - calc_rev) < 0.1:
                logger.info(f"✅ PASS: Revenue correctly reflects DB state: ${rev_b}")
            else:
                logger.error(f"❌ FAIL: Revenue calculation error. Dashboard says {rev_b}, DB Sum says {calc_rev}")

            logger.info("--- Audit Complete ---")

        except Exception as e:
            logger.error(f"Audit failed with error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Cleanup
            logger.info("Cleaning up...")
            await session.rollback()
            
            # Robust cleanup (handle circular ref)
            test_tg_id = "999999999"  # Ensure it's defined
            cleanup_partners = (await session.exec(select(Partner).where(Partner.telegram_id == test_tg_id))).all()
            for p in cleanup_partners:
                p.last_transaction_id = None
                session.add(p)
            await session.commit()
            
            p_ids = [p.id for p in cleanup_partners]
            if p_ids:
                # Delete all dependent records first
                from app.models.partner import XPTransaction, Earning, PartnerTask
                
                await session.exec(delete(PartnerTransaction).where(PartnerTransaction.partner_id.in_(p_ids)))
                await session.exec(delete(XPTransaction).where(XPTransaction.partner_id.in_(p_ids)))
                await session.exec(delete(Earning).where(Earning.partner_id.in_(p_ids)))
                await session.exec(delete(PartnerTask).where(PartnerTask.partner_id.in_(p_ids)))
                
                # Now delete partners
                await session.exec(delete(Partner).where(Partner.id.in_(p_ids)))
                await session.commit()
                
            # Double check delete by telegram_id
            await session.exec(delete(Partner).where(Partner.telegram_id == test_tg_id))
            await session.commit()

            
            # Restore Slot Counter
            setting = (await session.exec(select(SystemSetting).where(SystemSetting.key == "pro_slots_sold"))).first()
            if setting:
                setting.value = str(initial_slots)
                session.add(setting)
            await session.commit()

if __name__ == "__main__":
    asyncio.run(audit_admin_scenarios())
