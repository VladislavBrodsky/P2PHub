
import asyncio
import logging
from datetime import datetime
from sqlmodel import select
from app.models.partner import Partner, SystemSetting
from app.models.transaction import PartnerTransaction
from app.services.payment_service import payment_service
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import settings

# Manually create engine to avoid global scope issues
engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"), echo=True, future=True)

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_pro_plus_logic():
    async with AsyncSession(engine) as session:
        # 1. Create a Test Partner
        test_tg_id = 999999999
        partner = await session.exec(select(Partner).where(Partner.telegram_id == str(test_tg_id)))
        partner = partner.first()
        
        if not partner:
            partner = Partner(
                telegram_id=str(test_tg_id),
                first_name="Test",
                username="test_pro_plus",
                referral_code="test_pro_plus"
            )
            session.add(partner)
            await session.commit()
            await session.refresh(partner)
            logger.info(f"Created/Found Test Partner: {partner.id}")

        # 2. Simulate PRO+ Purchase ($69)
        # Verify Settings first
        logger.info(f"PRO+ Price: {settings.PRO_PLUS_PRICE_USD}")
        logger.info(f"PRO+ Tokens: {settings.PRO_PLUS_TOKENS_MONTHLY}")
        
        amount = 69.0
        currency = "USDT"
        network = "TRC20"
        tx_hash = "TEST_HASH_PRO_PLUS_" + datetime.now().strftime("%Y%m%d%H%M%S")

        logger.info("--- Simulating PRO+ Upgrade ---")
        
        # We need to call upgrade_to_pro. 
        # Note: distribute_pro_commissions will try to give XP/Commission. 
        # Since this user has no referrer, it should be fine/safe.
        
        await payment_service.upgrade_to_pro(
            session=session,
            partner=partner,
            amount=amount,
            currency=currency,
            network=network,
            tx_hash=tx_hash
        )
        
        # We need to commit to save changes if upgrade_to_pro doesn't commit (it usually does add to session, but caller commits? logic check)
        # Checking payment_service.py: it does session.add(partner) and awaits distribute_pro_commissions.
        # It does NOT seem to call session.commit() inside upgrade_to_pro based on previous views (it might, let's check).
        # Actually usually service methods expect caller to commit or do it themselves. 
        # Looking at previous step 468, it does `await session.flush()` for transaction but no `commit()`.
        # Wait, if `distribute_pro_commissions` commits, then yes. Otherwise we need to commit here to persist for reading.
        # But for verification in this script, we can check session objects before commit or just commit.
        
        await session.commit()
        await session.refresh(partner)
        
        logger.info("--- Verification Results ---")
        logger.info(f"Partner is_pro: {partner.is_pro}")
        logger.info(f"Subscription Plan: {partner.subscription_plan}")
        logger.info(f"Expires At: {partner.pro_expires_at}")
        logger.info(f"Pro Tokens: {partner.pro_tokens}")
        logger.info(f"Payment Details: {partner.payment_details}")
        
        # Check Transaction
        stmt_tx = select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash)
        result_tx = await session.exec(stmt_tx)
        transaction = result_tx.first()
        
        if transaction:
             logger.info(f"Transaction Record Found: ID={transaction.id}, Status={transaction.status}, Amount={transaction.amount}")
        else:
             logger.error("Transaction Record NOT Found!")

        # 3. Simulate Extension (Purchase Again)
        logger.info("--- Simulating Second PRO+ Purchase (Extension Check) ---")
        tx_hash_2 = "TEST_HASH_PRO_PLUS_2_" + datetime.now().strftime("%Y%m%d%H%M%S")
        
        # If PRO+ is lifetime, it should remain lifetime. 
        # If the user somehow wanted it to be monthly, we will see it fail (it will stay None).
        
        await payment_service.upgrade_to_pro(
            session=session,
            partner=partner,
            amount=amount,
            currency=currency,
            network=network,
            tx_hash=tx_hash_2
        )
        await session.commit()
        await session.refresh(partner)
        
        logger.info(f"Plan after 2nd purchase: {partner.subscription_plan}")
        logger.info(f"Expires after 2nd purchase: {partner.pro_expires_at}")

        # Cleanup
        # session.delete(partner)
        # await session.commit()

if __name__ == "__main__":
    asyncio.run(verify_pro_plus_logic())
