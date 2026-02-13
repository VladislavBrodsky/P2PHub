import json
import logging

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user
from app.models.partner import Partner, get_session
from app.services.notification_service import notification_service
from app.services.payment_service import payment_service
from app.services.audit_service import audit_service
from app.models.transaction import PartnerTransaction

router = APIRouter()
@router.get("/config")
async def get_payment_config():
    """
    Returns payment configuration: prices and admin addresses.
    """
    return {
        "pro_price_usd": payment_service.PRO_PRICE_USD,
        "admin_ton_address": settings.ADMIN_TON_ADDRESS,
        "admin_usdt_address": settings.ADMIN_USDT_ADDRESS
    }

@router.post("/create")
async def create_invoice(
    amount: float = Body(..., embed=True),
    currency: str = Body(..., embed=True),
    network: str = Body(..., embed=True),
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Creates a pending transaction in the database.
    Used before the user starts the payment flow.
    """
    try:
        if "user" in user_data:
            tg_id = str(json.loads(user_data["user"]).get("id"))
        else:
            tg_id = str(user_data.get("id"))
    except Exception as e:
        logger.warning(f"Invalid user data in create_invoice: {e}")
        raise HTTPException(status_code=400, detail="Invalid user data")

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    transaction = await payment_service.create_transaction(
        session, partner.id, amount, currency, network
    )
    await session.commit()

    return transaction

@router.post("/session")
async def create_payment_session(
    amount: float = Body(39.0, embed=True),
    currency: str = Body("TON", embed=True),
    network: str = Body("TON", embed=True),
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Creates a payment session (TON or Crypto).
    """
    try:
        if "user" in user_data:
            tg_id = str(json.loads(user_data["user"]).get("id"))
        else:
            tg_id = str(user_data.get("id"))
    except Exception as e:
        logger.warning(f"Invalid user data in create_payment_session: {e}")
        raise HTTPException(status_code=400, detail="Invalid user data")

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    payment_data = await payment_service.create_payment_session(
        session, partner.id, amount, currency, network
    )
    
    # #comment: Log session creation so we can track conversion rates and abandoned carts.
    await audit_service.log_event(
        session=session,
        entity_type="payment_session",
        entity_id=str(payment_data.get("transaction_id", "unknown")),
        action="payment_session_created",
        actor_id=tg_id,
        details={
            "amount": amount,
            "currency": currency,
            "network": network,
            "expires_at": payment_data.get("expires_at")
        }
    )
    
    await session.commit()

    return payment_data


@router.post("/verify-ton")
async def verify_ton(
    tx_hash: str = Body(..., embed=True),
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Verifies a TON transaction hash and upgrades user to PRO if valid.
    """
    try:
        if "user" in user_data:
            tg_id = str(json.loads(user_data["user"]).get("id"))
        else:
            tg_id = str(user_data.get("id"))
    except Exception as e:
        logger.warning(f"Invalid user data in verify_ton: {e}")
        raise HTTPException(status_code=400, detail="Invalid user data")

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    success = await payment_service.verify_ton_transaction(session, partner, tx_hash)

    # #comment: Log the verification result for audit purposes.
    # We record whether the verification succeeded or failed, and the hash used.
    await audit_service.log_event(
        session=session,
        entity_type="transaction",
        entity_id=tx_hash, # Using hash as ID for lookup since we might not have a txn ID yet if failed
        action="ton_verification_attempt",
        actor_id=tg_id,
        details={
            "tx_hash": tx_hash,
            "success": success
        }
    )
    # Commit audit log (flush logic handles ID generation but commit persists it)
    await session.commit()

    if success:
        return {"status": "success", "message": "Upgraded to PRO"}
    else:
        raise HTTPException(status_code=400, detail="Transaction verification failed or still pending")

@router.post("/submit-manual")
async def submit_manual_payment(
    currency: str = Body(..., embed=True),
    network: str = Body(..., embed=True),
    amount: float = Body(..., embed=True),
    tx_hash: str | None = Body(None, embed=True),
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Submits a manual payment claim for non-TON crypto.
    Requires admin review.
    """
    try:
        if "user" in user_data:
            tg_id = str(json.loads(user_data["user"]).get("id"))
        else:
            tg_id = str(user_data.get("id"))
    except Exception as e:
        logger.warning(f"Invalid user data in submit_manual_payment: {e}")
        raise HTTPException(status_code=400, detail="Invalid user data")

    try:
        statement = select(Partner).where(Partner.telegram_id == tg_id)
        result = await session.exec(statement)
        partner = result.first()

        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")

        # #comment: Create a new transaction record with 'manual_review' status.
        # This prevents the user from being upgraded immediately but allows admins to see the request.
        transaction = await payment_service.create_transaction(
            session, partner.id, amount, currency, network, tx_hash
        )
        transaction.status = "manual_review"
        session.add(transaction)
        await session.commit()
        await session.refresh(transaction)

        # #comment: Log this action in the audit table for security and history tracking.
        await audit_service.log_event(
            session=session,
            entity_type="transaction",
            entity_id=str(transaction.id),
            action="manual_payment_submitted",
            actor_id=tg_id,
            details={
                "amount": amount,
                "currency": currency,
                "network": network,
                "tx_hash": tx_hash
            }
        )
        await session.commit()

        # #comment: Background task to notify admins.
        # Specific requirement: Notify @uslincoln (ID: 537873096) with detailed user info.
        async def notify_admins():
            # Construct a detailed message with all necessary verification info
            # We include the ID and Username so the admin knows exactly who to look up.
            safe_username = f"@{partner.username}" if partner.username else "No Username"
            
            admin_msg = (
                "🚨 *NEW MANUAL PAYMENT PENDING REVIEW* 🚨\n\n"
                f"👤 *User:* {safe_username} (`{partner.telegram_id}`)\n"
                f"💰 *Amount:* ${amount} {currency}\n"
                f"🌐 *Network:* {network}\n"
                f"📝 *TX Hash:* `{tx_hash or 'Not Provided'}`\n\n"
                f"🆔 *Trans ID:* `{transaction.id}`\n\n"
                "👉 *Action Required:* Please verify this transaction in the Admin Panel or use /admin commands."
            )
            
            # #comment: Primary Admin Notification (uslincoln)
            # We explicitly target the main admin first to ensure they get the alert.
            main_admin_id = "537873096" 
            try:
                await notification_service.enqueue_notification(
                    chat_id=int(main_admin_id),
                    text=admin_msg
                )
            except Exception as e:
                logger.error(f"Failed to notify main admin {main_admin_id}: {e}")

            # #comment: Notify other configured admins as backup
            # We skip the main admin if they are in the list to avoid duplicate notifications (though enqueue might handle it, better safe).
            for admin_id in settings.ADMIN_USER_IDS:
                if str(admin_id) == main_admin_id:
                    continue
                    
                try:
                    await notification_service.enqueue_notification(
                        chat_id=int(admin_id),
                        text=admin_msg
                    )
                except Exception as e:
                    logger.error(f"Failed to notify admin {admin_id} about manual payment: {e}")
        
        asyncio.create_task(notify_admins())

        return {"status": "submitted", "message": "Payment submitted for manual review. Admins have been notified."}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
