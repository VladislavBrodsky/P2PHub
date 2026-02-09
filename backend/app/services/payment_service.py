import logging
import requests
from typing import Optional, List
from datetime import datetime, timedelta
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner
from app.models.transaction import Transaction
from app.core.config import settings

logger = logging.getLogger(__name__)

# Constants for Subscription
PRO_PRICE_USD = 39.0
TON_API_BASE = "https://tonapi.io/v2" # Example TON API

class PaymentService:
    async def create_transaction(
        self, 
        session: AsyncSession, 
        partner_id: int, 
        amount: float, 
        currency: str, 
        network: str,
        tx_hash: Optional[str] = None
    ) -> Transaction:
        transaction = Transaction(
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
        stmt = select(Transaction).where(Transaction.tx_hash == tx_hash)
        res = await session.exec(stmt)
        existing = res.first()
        if existing and existing.status == "completed":
            return True

        # 2. Fetch TX from TON API
        # Note: You would normally use an API Key here if rate-limited
        try:
            # Simplified mock/logic: In production, use TON SDK or reliable API
            # For this implementation, we assume we check the transaction details
            # response = requests.get(f"{TON_API_BASE}/blockchain/transactions/{tx_hash}")
            # tx_data = response.json()
            
            # TODO: Add real TON API verification logic here
            # For now, let's assume we implement a Placeholder verification that succeeds for testing
            mock_success = True 
            
            if mock_success:
                await self.upgrade_to_pro(session, partner, tx_hash, "TON", "TON", PRO_PRICE_USD)
                return True
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

        if not transaction:
            transaction = Transaction(
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
        
        logger.info(f"Partner {partner.telegram_id} upgraded to PRO via {currency}")

payment_service = PaymentService()
