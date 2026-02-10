import logging
import requests
import json
from typing import Optional, List
from datetime import datetime, timedelta
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner
from app.models.transaction import PartnerTransaction
from app.core.config import settings

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
            response = requests.get(f"{TON_API_BASE}/rates?tokens=ton&currencies=usd", timeout=5)
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
        Verifies a TON transaction hash via TON API.
        Checks if the destination address matches admin wallet and amount is correct.
        """
        # 1. Check if TX already processed
        stmt = select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash)
        res = await session.exec(stmt)
        existing = res.first()
        if existing and existing.status == "completed":
            return True

        # 2. Fetch TX from TON API
        try:
            # Use account/transactions for simpler lookup if tx_hash is actually a message hash
            # or blockchain/transactions/{tx_hash}
            response = requests.get(f"{TON_API_BASE}/blockchain/transactions/{tx_hash}", timeout=10)
            if response.status_code != 200:
                logger.warning(f"TON API returned {response.status_code} for {tx_hash}")
                return False
                
            tx_data = response.json()
            
            # 3. Validate Transaction Data
            # A TON transaction has 'out_msgs'. We look for a message to the ADMIN wallet.
            found_valid_msg = False
            total_nano_ton = 0
            
            for out_msg in tx_data.get("out_msgs", []):
                dest = out_msg.get("destination", {}).get("address")
                # Normalize addresses (tonapi returns raw or bounceable)
                # For simplicity, we compare as strings, but ideally normalize
                if dest == settings.ADMIN_TON_ADDRESS:
                    total_nano_ton += int(out_msg.get("value", 0))
                    found_valid_msg = True
            
            if not found_valid_msg:
                # Some wallets might have the admin as the main 'account' of the transaction 
                # if the user sent it directly. Check the transaction's account.
                if tx_data.get("account", {}).get("address") == settings.ADMIN_TON_ADDRESS:
                    # This is likely an incoming message if viewed from the account's perspective
                    # But here we are fetching by hash.
                    # We usually look at in_msg for the contract call or out_msgs if it's a trace.
                    pass

            # 4. Check Amount
            ton_price = await self.get_ton_price()
            expected_ton = PRO_PRICE_USD / ton_price
            received_ton = total_nano_ton / NANO_TON
            
            # Allow 10% slippage/buffer for price fluctuations
            if received_ton >= (expected_ton * 0.9):
                await self.upgrade_to_pro(session, partner, tx_hash, "TON", "TON", received_ton * ton_price)
                return True
            else:
                logger.warning(f"Insufficient TON received: {received_ton} < {expected_ton * 0.9}")
                
        except Exception as e:
            logger.error(f"Error verifying TON transaction {tx_hash}: {e}")
            
        return False

    async def upgrade_to_pro(
        self, 
        session: AsyncSession, 
        partner: Partner, 
        tx_hash: str, 
        currency: str, 
        network: str,
        amount: float
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
            session.add(transaction)
            
        # Update Partner with verification details
        partner.last_transaction_id = transaction.id
        partner.payment_details = json.dumps({
            "currency": currency,
            "network": network,
            "tx_hash": tx_hash,
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
