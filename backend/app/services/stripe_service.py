import logging
from typing import Any, Optional

import stripe
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import Partner
from app.models.transaction import PartnerTransaction

logger = logging.getLogger(__name__)

# Stripe SDK v5+ moved errors to stripe.* directly; v4 used stripe.error.*
# This guard makes the code compatible with both versions.
try:
    _StripeError = stripe.StripeError
    _SignatureVerificationError = stripe.SignatureVerificationError
except AttributeError:
    _StripeError = stripe.error.StripeError  # type: ignore[attr-defined]
    _SignatureVerificationError = stripe.error.SignatureVerificationError  # type: ignore[attr-defined]

if settings.STRIPE_API_KEY:
    stripe.api_key = settings.STRIPE_API_KEY

class StripeService:
    async def create_checkout_session(
        self, 
        partner_id: int, 
        plan: str,
        success_url: str,
        cancel_url: str,
        is_upgrade: bool = False
    ) -> str | None:
        """
        Creates a Stripe Checkout Session for PRO or PRO+ upgrade.
        Returns the session URL for redirection.
        """
        if not settings.STRIPE_API_KEY:
            logger.error("Stripe API Key is not configured")
            return None

        # Determine the correct Price ID
        if plan == "PRO":
            price_id = settings.STRIPE_PRO_PRICE_ID
        elif plan == "PRO_PLUS":
            # Fallback to standard PRO_PLUS if UPGRADE ID is missing
            price_id = settings.STRIPE_UPGRADE_PRICE_ID or settings.STRIPE_PRO_PLUS_PRICE_ID
        else:
            logger.error(f"Invalid plan type: {plan}")
            return None

        if not price_id:
            logger.error(f"Stripe Price ID for plan {plan} (is_upgrade={is_upgrade}) is not configured")
            return None

        try:
            # 2026 Best Practice: Using 'subscription' mode for recurring price IDs
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription', # Must be 'subscription' for recurring prices
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=str(partner_id),
                allow_promotion_codes=True,
                metadata={
                    'partner_id': str(partner_id),
                    'plan': plan,
                    'is_tma': 'true',
                    'is_upgrade': str(is_upgrade).lower()
                }
            )
            return session.url
        except _StripeError as e:
            logger.error(f"Stripe API error: {e.user_message if hasattr(e, 'user_message') else str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating Stripe session: {e}")
            return None

    async def handle_webhook(self, payload: bytes, sig_header: str, session: AsyncSession) -> bool:
        """
        Processes Stripe webhook events.
        Currently handles only checkout.session.completed.
        """
        if not settings.STRIPE_WEBHOOK_SECRET:
            logger.error("Stripe Webhook Secret is not configured")
            return False

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid Stripe webhook payload: {e}")
            return False
        except _SignatureVerificationError as e:
            logger.error(f"Invalid Stripe webhook signature: {e}")
            return False

        if event['type'] == 'checkout.session.completed':
            checkout_session = event['data']['object']
            return await self._process_successful_payment(checkout_session, session)

        return False

    async def _process_successful_payment(self, checkout_session: Any, session: AsyncSession) -> bool:
        """
        Triggered when a Stripe Checkout Session is successfully completed.
        Upgrades the partner to PRO/PRO+.
        """
        partner_id = checkout_session.get('client_reference_id')
        metadata = checkout_session.get('metadata', {})
        plan = metadata.get('plan', 'PRO')
        stripe_session_id = checkout_session.get('id')
        amount_total = checkout_session.get('amount_total', 0) / 100 # Convert from cents

        if not partner_id:
            logger.error("Stripe webhook missing client_reference_id")
            return False

        partner = await session.get(Partner, int(partner_id))
        if not partner:
            logger.error(f"Partner {partner_id} not found from Stripe webhook")
            return False

        # Check if this transaction already processed
        stmt = select(PartnerTransaction).where(PartnerTransaction.tx_hash == stripe_session_id)
        existing = (await session.exec(stmt)).first()
        if existing:
            logger.info(f"Stripe transaction {stripe_session_id} already processed")
            return True

        from app.services.payment_service import payment_service
        
        logger.info(f"✅ Stripe Webhook: Upgrading partner {partner.telegram_id} to {plan}")
        
        try:
            await payment_service.upgrade_to_pro(
                session=session,
                partner=partner,
                amount=float(amount_total),
                currency="USD",
                network="STRIPE",
                tx_hash=stripe_session_id
            )
            return True
        except Exception as e:
            logger.error(f"Failed to upgrade user via Stripe webhook: {e}")
            return False

stripe_service = StripeService()
