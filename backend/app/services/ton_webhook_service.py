"""
TonAPI Webhook Service
======================
Handles incoming webhook events from TonAPI when transactions land on the admin wallet.
Supports both native TON transfers and USDT Jetton transfers.
"""
import hashlib
import hmac
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.transaction import PartnerTransaction
from app.models.partner import Partner

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Known USDT Jetton Master on TON mainnet
# ─────────────────────────────────────────────
USDT_JETTON_MASTER = "EQCxE6mUtFVHajFQMcq5NZWQ6Y2b5n-Auh8v5o_Q4FijIaZ3"


class TonWebhookService:
    def validate_signature(self, raw_body: bytes, signature_header: str | None) -> bool:
        """
        Validates the HMAC-SHA256 signature provided by TonAPI in the
        'X-Webhook-Signature' header. Returns True if valid or if no
        webhook secret is configured (dev mode).
        """
        if not settings.TON_WEBHOOK_SECRET:
            logger.warning("⚠️ TON_WEBHOOK_SECRET not set — skipping signature check (dev mode)")
            return True

        if not signature_header:
            logger.warning("Missing X-Webhook-Signature header")
            return False

        expected = hmac.new(
            settings.TON_WEBHOOK_SECRET.encode(),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected, signature_header.lower())

    async def process_event(self, payload: dict[str, Any], session: AsyncSession) -> bool:
        """
        Main entry point for a TonAPI webhook event.
        Dispatches to the appropriate handler based on event type.
        Returns True if a payment was matched and processed.
        """
        event_type = payload.get("event_type") or payload.get("type")
        logger.info(f"📡 TonAPI Webhook event received: {event_type}")

        # TonAPI Payment Tracker fires 'payment' or 'transaction' events
        if event_type in ("payment", "transaction", "ton_transfer", "jetton_transfer"):
            return await self._process_transaction_event(payload, session)

        # Some versions wrap events in a 'data' field
        if "data" in payload:
            return await self._process_transaction_event(payload["data"], session)

        logger.info(f"Unhandled webhook event type: {event_type}")
        return False

    async def _process_transaction_event(self, data: dict[str, Any], session: AsyncSession) -> bool:
        """
        Parses a transaction/payment event and tries to match it with a
        pending PartnerTransaction. Upgrades the user if matched.
        """
        # ── 1. Extract amount and currency ─────────────────────────────
        amount_usdt, amount_ton, tx_hash, sender = None, None, None, None

        tx_hash = (
            data.get("hash")
            or data.get("tx_hash")
            or data.get("transaction_hash")
            or data.get("lt")  # Logical time as fallback identifier
        )

        # TON native transfer
        if "value" in data and data.get("currency", "TON") == "TON":
            amount_ton = int(data.get("value", 0)) / 1_000_000_000

        # Jetton (USDT) transfer
        jetton = data.get("jetton") or data.get("jetton_master") or {}
        if isinstance(jetton, dict):
            jetton_address = jetton.get("address", "")
            if jetton_address and USDT_JETTON_MASTER.lower() in jetton_address.lower():
                raw_amount = int(data.get("amount", 0))
                amount_usdt = raw_amount / 1_000_000  # USDT has 6 decimals

        # Handle flat amount with explicit currency field (Payment Tracker style)
        if amount_ton is None and amount_usdt is None:
            currency = data.get("currency", "").upper()
            raw_amount = data.get("amount", 0)
            if currency == "TON":
                amount_ton = float(raw_amount)
            elif currency in ("USDT", "USD₮"):
                amount_usdt = float(raw_amount)

        if amount_ton is None and amount_usdt is None:
            logger.warning(f"Could not extract amount from webhook payload: {data}")
            return False

        amount = amount_usdt if amount_usdt else amount_ton
        currency = "USDT" if amount_usdt else "TON"

        logger.info(f"💰 Webhook: received {amount} {currency} | hash={tx_hash}")

        # ── 2. Find a matching pending session ──────────────────────────
        cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(minutes=30)

        stmt = select(PartnerTransaction).where(
            PartnerTransaction.status == "pending",
            PartnerTransaction.currency == currency,
            PartnerTransaction.created_at >= cutoff,
        ).order_by(PartnerTransaction.created_at.desc())

        pending_txs = (await session.exec(stmt)).all()

        if not pending_txs:
            logger.info(f"No pending {currency} transactions found to match webhook event.")
            return False

        # ── 3. Match by amount (with 2% tolerance) ────────────────────
        matched_tx: PartnerTransaction | None = None
        for ptx in pending_txs:
            expected = ptx.amount_crypto if currency == "TON" else ptx.amount
            if expected and abs(float(expected) - amount) <= (float(expected) * 0.02):
                # Also guard: tx_hash must not already be used
                if tx_hash:
                    existing = (await session.exec(
                        select(PartnerTransaction).where(
                            PartnerTransaction.tx_hash == str(tx_hash),
                            PartnerTransaction.status == "completed"
                        )
                    )).first()
                    if existing:
                        logger.warning(f"🚨 Webhook: hash {tx_hash} already used by partner {existing.partner_id}")
                        return False

                matched_tx = ptx
                break

        if not matched_tx:
            logger.info(f"Webhook: No pending session matched {amount} {currency}. Manual review may be required.")
            return False

        # ── 4. Fetch partner and trigger upgrade ────────────────────────
        partner = await session.get(Partner, matched_tx.partner_id)
        if not partner:
            logger.error(f"Webhook: Partner {matched_tx.partner_id} not found for PTX {matched_tx.id}")
            return False

        # Attach hash if we have it
        if tx_hash:
            matched_tx.tx_hash = str(tx_hash)
            session.add(matched_tx)

        logger.info(f"✅ Webhook: Matched PTX {matched_tx.id} for partner {partner.telegram_id}. Triggering upgrade...")

        from app.services.payment_service import payment_service
        await payment_service.upgrade_to_pro(
            session=session,
            partner=partner,
            amount=matched_tx.amount,
            currency=currency,
            network="TON" if currency == "TON" else "TON_JETTON",
            tx_hash=str(tx_hash) if tx_hash else None,
            transaction_id=matched_tx.id,
        )

        logger.info(f"🚀 Webhook: Partner {partner.telegram_id} auto-upgraded via {currency} webhook!")
        return True


ton_webhook_service = TonWebhookService()
