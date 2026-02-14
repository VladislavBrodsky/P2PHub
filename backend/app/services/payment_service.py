import json
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import Partner
from app.models.transaction import PartnerTransaction
from app.services.ton_verification_service import ton_verification_service
from app.services.redis_service import redis_service
from app.core.http_client import http_client
import sentry_sdk

logger = logging.getLogger(__name__)

# Constants for Subscription
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
        await session.flush()
        await session.refresh(transaction)
        return transaction

    async def create_payment_session(
        self,
        session: AsyncSession,
        partner_id: int,
        amount_usd: float = settings.PRO_PRICE_USD,
        currency: str = "TON",
        network: str = "TON"
    ) -> dict:
        """
        Creates a payment session. 
        TON: 10 minutes.
        USDT/Crypto: 30 minutes.
        """
        expires_in_minutes = 30 if currency == "USDT" else 10
        
        if currency == "TON":
            ton_price = await self.get_ton_price()
            # Add 2% buffer for spread/volatility to ensure they pay enough
            amount_crypto = (amount_usd / ton_price) * 1.02
        else:
            amount_crypto = amount_usd # For USDT it's 1:1

        transaction = PartnerTransaction(
            partner_id=partner_id,
            amount=amount_usd,
            amount_crypto=amount_crypto,
            currency=currency,
            network=network,
            status="pending"
        )
        session.add(transaction)
        await session.flush()
        await session.refresh(transaction)

        return {
            "transaction_id": transaction.id,
            "amount": round(amount_crypto, 4),
            "currency": currency,
            "network": network,
            "address": settings.ADMIN_TON_ADDRESS if currency == "TON" else settings.ADMIN_USDT_ADDRESS,
            "expires_at": (transaction.created_at + timedelta(minutes=expires_in_minutes)).isoformat()
        }

    async def get_ton_price(self) -> float:
        """Fetches current TON/USD price with caching (1 minute)."""
        cache_key = "ton_price_usd"
        try:
            cached_price = await redis_service.get(cache_key)
            if cached_price:
                return float(cached_price)
        except Exception:
            pass

        try:
            client = await http_client.get_client()
            # #comment: Using TonAPI.io for reliable, high-precision price data.
            response = await client.get(f"{TON_API_BASE}/rates?tokens=ton&currencies=usd")
            data = response.json()
            # Extract price from standardized TonAPI response format
            price = float(data['rates']['TON']['prices']['USD'])
            
            # Cache for 60 seconds
            try:
                await redis_service.set(cache_key, str(price), expire=60)
            except Exception:
                pass
                
            return price
        except Exception as e:
            logger.error(f"Error fetching TON price: {e}")
            return 5.5 # Fallback conservative price if API fails
            
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
        sentry_sdk.add_breadcrumb(
            category="payment",
            message=f"Verifying TON transaction for partner {partner.telegram_id}: {tx_hash}",
            level="info"
        )
        # 1. Check if TX already processed (Global Uniqueness per hash)
        stmt = select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash)
        res = await session.exec(stmt)
        existing = res.first()
        if existing and existing.status == "completed":
            logger.info(f"Transaction {tx_hash} already completed.")
            return True

        # 2. Find the most recent pending TON transaction for this partner
        # A "session" is valid if created within last 10 minutes
        ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)
        stmt_session = select(PartnerTransaction).where(
            PartnerTransaction.partner_id == partner.id,
            PartnerTransaction.status == "pending",
            PartnerTransaction.currency == "TON",
            PartnerTransaction.created_at >= ten_mins_ago
        ).order_by(PartnerTransaction.created_at.desc())

        res_session = await session.exec(stmt_session)
        active_session = res_session.first()

        if not active_session:
            logger.warning(f"No active TON session found for partner {partner.id} in the last 10 minutes.")
            return False

        # 3. Use the fixed crypto amount stored at session creation
        # This prevents verification failures due to price fluctuations between payment and verification.
        expected_ton = active_session.amount_crypto or ((active_session.amount / 5.5) * 1.02)

        # 4. Call dedicated verification service with robust validation parameters
        is_valid = await ton_verification_service.verify_transaction(
            tx_hash=tx_hash,
            expected_amount_ton=expected_ton * 0.98, # Allow 2% slippage margin for gas fees/precision
            expected_address=settings.ADMIN_TON_ADDRESS
        )

        if is_valid:
            # Upgrade user to PRO
            await self.upgrade_to_pro(
                session=session,
                partner=partner,
                amount=active_session.amount,
                currency="TON",
                network="TON",
                tx_hash=tx_hash,
                transaction_id=active_session.id
            )
            
            # #comment: Service-level audit log (covers Bot & API)
            from app.services.audit_service import audit_service
            await audit_service.log_event(
                session=session,
                entity_type="transaction",
                entity_id=tx_hash,
                action="ton_verification_success",
                actor_id=str(partner.telegram_id),
                details={"amount": active_session.amount}
            )
            
            return True

        # If it failed but session is still valid, we keep it pending.
        # If we wanted to cancel it explicitly on failure, we could,
        # but the 10-min check handles it.
        
        # #comment: Audit failure
        from app.services.audit_service import audit_service
        await audit_service.log_event(
            session=session,
            entity_type="transaction",
            entity_id=tx_hash,
            action="ton_verification_failed",
            actor_id=str(partner.telegram_id),
            details={"error": "Invalid Hash or Amount mismatch"}
        )

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
        try:
            sentry_sdk.add_breadcrumb(
                category="payment",
                message=f"Executing PRO upgrade for partner {partner.telegram_id}",
                level="info"
            )
            # 1. Update Partner
            now = datetime.utcnow()
            if partner.is_pro and partner.pro_expires_at and partner.pro_expires_at > now:
                # Extension: Add 30 days to existing expiry
                partner.pro_expires_at += timedelta(days=30)
            else:
                # New or re-activation
                partner.pro_expires_at = now + timedelta(days=30)
                
            partner.is_pro = True
            if not partner.pro_started_at:
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

            # 3. Distribute Commissions to Ancestors (BEFORE commit for transaction atomicity)
            # #comment: CRITICAL - Commission distribution must happen in the same transaction as the upgrade.
            # If we commit first, then commissions fail, the user gets upgraded but referrers don't get paid.
            # By doing this before commit, we ensure both succeed or both rollback on error.
            from app.services.referral_service import distribute_pro_commissions
            await distribute_pro_commissions(session, partner.id, amount)
            
            # Commit everything atomically
            await session.commit()


            # 4. Send Visionary & Viral Messages
            from app.core.i18n import get_msg
            from app.services.notification_service import notification_service

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
            return True
        except Exception as e:
            sentry_sdk.capture_exception(e)
            logger.error(f"❌ PRO Upgrade Failed for {partner.telegram_id}: {e}")
            raise e

payment_service = PaymentService()
