"""
Webhook Endpoints
==================
Receives inbound push events from external payment providers.
Currently handles TonAPI payment tracking webhooks.
"""
import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import get_session
from app.services.ton_webhook_service import ton_webhook_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post(
    "/ton",
    summary="TonAPI Payment Webhook",
    description=(
        "Receives transaction events from TonAPI when funds land on the admin wallet. "
        "Auto-matches to pending PartnerTransactions and upgrades users without manual verification."
    ),
    status_code=status.HTTP_200_OK,
)
async def ton_payment_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
    x_webhook_signature: str | None = Header(default=None, alias="X-Webhook-Signature"),
):
    """
    Endpoint registered with TonAPI Payment Tracker.
    TonAPI sends a POST here whenever a transaction hits the monitored wallet address.
    """
    raw_body = await request.body()

    # ── 1. Validate HMAC signature ────────────────────────────────────
    if not ton_webhook_service.validate_signature(raw_body, x_webhook_signature):
        logger.warning("🚫 Webhook: Invalid signature — rejecting request.")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    # ── 2. Parse JSON payload ─────────────────────────────────────────
    try:
        payload = await request.json()
    except Exception:
        logger.warning("Webhook: Could not parse JSON body.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    logger.info(f"📡 /api/webhooks/ton received payload keys: {list(payload.keys())}")

    # ── 3. Process the event ──────────────────────────────────────────
    try:
        matched = await ton_webhook_service.process_event(payload, session)
        if matched:
            logger.info("✅ Webhook: Payment matched and user upgraded successfully.")
            return {"status": "ok", "matched": True}
        else:
            # Return 200 even if no match — TonAPI will retry on non-2xx responses
            # which would cause duplicate processing attempts
            logger.info("ℹ️ Webhook: No matching pending transaction found. Acknowledged.")
            return {"status": "ok", "matched": False}
    except Exception as e:
        logger.error(f"❌ Webhook processing failed: {e}", exc_info=True)
        # Return 200 to prevent TonAPI from retrying (avoid duplicate upgrades)
        return {"status": "error", "detail": "Processing failed — manual review required"}
