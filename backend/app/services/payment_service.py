import logging
import httpx
import json
from typing import Optional, List
from datetime import datetime, timedelta
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner
from app.models.transaction import PartnerTransaction
from app.core.config import settings
from app.services.ton_verification_service import ton_verification_service

logger = logging.getLogger(__name__)

# Constants for Subscription
PRO_PRICE_USD = 39.0
TON_API_BASE = "https://tonapi.io/v2"
NANO_TON = 10**9

class PaymentService:
    async def create_transaction(
        self, 
        session: AsyncSession, 
        partner_id: int, 
        amount: float, 
        currency: str, 
        network: str,
        tx_hash: Optional[str] = None
    ) -> PartnerTransaction:
        transaction = PartnerTransaction(
            partner_id=partner_id,
            amount=amount,
            currency=currency,
            network=network,
            tx_hash=tx_hash,
            status="pending"
        )
        session.add(transaction)
        await session.commit()
        await session.refresh(transaction)
        return transaction

    async def get_ton_price(self) -> float:
        """Fetches current TON/USD price from TON API or fallback."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{TON_API_BASE}/rates?tokens=ton&currencies=usd")
                data = response.json()
                return float(data['rates']['TON']['prices']['USD'])
        except Exception as e:
            logger.error(f"Error fetching TON price: {e}")
            return 5.5 # Fallback price if API fails
            
    async def verify_ton_transaction(
        self, 
        session: AsyncSession, 
        partner: Partner, 
        tx_hash: str
    ) -> bool:
        """
        Verifies a TON transaction hash via TonVerificationService.
        Checks if the destination address matches admin wallet and amount is correct.
        """
        # 1. Check if TX already processed
        stmt = select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash)
        res = await session.exec(stmt)
        existing = res.first()
        if existing and existing.status == "completed":
            return True

        # 2. Get current price to calculate expected TON
        ton_price = await self.get_ton_price()
        expected_ton = PRO_PRICE_USD / ton_price
        
        # 3. Call dedicated verification service
        is_valid = await ton_verification_service.verify_transaction(
            tx_hash=tx_hash,
            expected_amount_ton=expected_ton * 0.95, # Allow 5% margin
            expected_address=settings.ADMIN_TON_ADDRESS
        )
        
        if is_valid:
            # Upgrade user to PRO
            # Upgrade user to PRO
            await self.upgrade_to_pro(
                session=session, 
                partner=partner, 
                amount=PRO_PRICE_USD,
                currency="TON", 
                network="TON", 
                tx_hash=tx_hash
            )
            return True
            
        return False

    async def upgrade_to_pro(
        self, 
        session: AsyncSession, 
        partner: Partner, 
        amount: float,
        currency: str, 
        network: str,
        tx_hash: Optional[str] = None,
        transaction_id: Optional[int] = None
    ):
        # 1. Update Partner
        now = datetime.utcnow()
        partner.is_pro = True
        partner.pro_expires_at = now + timedelta(days=30) # 1 month
        partner.pro_started_at = now
        if not partner.pro_purchased_at:
            partner.pro_purchased_at = now
            
        partner.subscription_plan = "PRO_MONTHLY"
        session.add(partner)

        # 2. Update or Create Transaction
        transaction = None
        if transaction_id:
            transaction = await session.get(PartnerTransaction, transaction_id)
        elif tx_hash:
            stmt = select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash)
            res = await session.exec(stmt)
            transaction = res.first()

        if not transaction:
            transaction = PartnerTransaction(
                partner_id=partner.id,
                amount=amount,
                currency=currency,
                network=network,
                tx_hash=tx_hash,
                status="completed"
            )
            session.add(transaction)
            await session.flush() # Get the ID
        else:
            transaction.status = "completed"
            # Update hash if provided and missing
            if tx_hash and not transaction.tx_hash:
                transaction.tx_hash = tx_hash
            session.add(transaction)
            
        # Update Partner with verification details
        partner.last_transaction_id = transaction.id
        partner.payment_details = json.dumps({
            "currency": currency,
            "network": network,
            "tx_hash": transaction.tx_hash or "MANUAL_CONFIRMATION",
            "amount": amount,
            "verified_at": now.isoformat()
        })
        
        session.add(partner)
        await session.commit()

        # 3. Distribute Commissions to Ancestors
        from app.services.partner_service import distribute_pro_commissions
        await distribute_pro_commissions(session, partner.id, amount)
        
        # 4. Send Visionary & Viral Messages
        from app.services.notification_service import notification_service
        from app.core.i18n import get_msg
        
        lang = partner.language_code or "en"
        
        # 4.1 Welcome Message
        welcome_msg = get_msg(lang, "pro_welcome")
        await notification_service.enqueue_notification(
            chat_id=int(partner.telegram_id),
            text=welcome_msg
        )
        
        # 4.2 Viral Congrats Message (Instruction to user to share)
        ref_link = f"{settings.FRONTEND_URL}?startapp={partner.referral_code}"
        viral_msg = get_msg(lang, "pro_viral_announcement", referral_link=ref_link)
        # We send it to them so they can forward/copy it
        await notification_service.enqueue_notification(
            chat_id=int(partner.telegram_id),
            text=f"🎁 *VIRAL KIT UNLOCKED!*\n\nShare this message to announce your PRO status and attract more partners:\n\n---\n{viral_msg}"
        )
        
        logger.info(f"Partner {partner.telegram_id} upgraded to PRO via {currency}")

payment_service = PaymentService()
