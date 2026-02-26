import asyncio
import json
import logging
from datetime import UTC, datetime

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, get_session
from app.models.transaction import PartnerTransaction
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.services.payment_service import payment_service

router = APIRouter()
@router.get("/config")
async def get_payment_config():
    """
    Returns payment configuration: prices and admin addresses.
    """
    return {
        "pro_price_usd": settings.PRO_PRICE_USD,
        "pro_plus_price_usd": settings.PRO_PLUS_PRICE_USD,
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
    if user_data is None:
        raise HTTPException(status_code=401, detail="Unauthorized: Telegram authentication required")

    try:

        tg_user = get_tg_user(user_data)
        tg_id = str(tg_user.get("id"))
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
    from app.models.audit_log import ActionType
    await audit_service.log_event(
        session=session,
        partner_id=partner.id,
        action_type=ActionType.PAYMENT,
        description=f"Transaction Pending: {amount} {currency}",
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

    statement = select(Partner).where(Partner.telegram_id == tg_id).with_for_update()
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    success = await payment_service.verify_ton_transaction(session, partner, tx_hash)

    # #comment: Log the verification result for audit purposes.
    # We record whether the verification succeeded or failed, and the hash used.
    from app.models.audit_log import ActionType
    await audit_service.log_event(
        session=session,
        partner_id=partner.id,
        action_type=ActionType.PAYMENT,
        description=f"TON Verification Attempted: {success}",
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

@router.post("/verify-usdt")
async def verify_usdt(
    tx_hash: str = Body(..., embed=True),
    network: str = Body("TRC20", embed=True),
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Verifies a USDT transaction hash (TRC-20 or TON Jetton) and upgrades user to PRO if valid.
    """
    try:
        tg_user = get_tg_user(user_data)
        tg_id = str(tg_user.get("id"))
    except Exception as e:
        logger.warning(f"Invalid user data in verify_usdt: {e}")
        raise HTTPException(status_code=400, detail="Invalid user data")

    statement = select(Partner).where(Partner.telegram_id == tg_id).with_for_update()
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    success = await payment_service.verify_usdt_transaction(session, partner, tx_hash, network)

    # Log the verification result
    from app.models.audit_log import ActionType
    await audit_service.log_event(
        session=session,
        partner_id=partner.id,
        action_type=ActionType.PAYMENT,
        description=f"USDT Verification Attempted ({network}): {success}",
        entity_type="transaction",
        entity_id=tx_hash,
        action="usdt_verification_attempt",
        actor_id=tg_id,
        details={
            "tx_hash": tx_hash,
            "network": network,
            "success": success
        }
    )
    await session.commit()

    if success:
        return {"status": "success", "message": "Upgraded successfully"}
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
    if user_data is None:
        raise HTTPException(status_code=401, detail="Unauthorized: Telegram authentication required")

    try:

        tg_user = get_tg_user(user_data)
        tg_id = str(tg_user.get("id"))
    except Exception as e:
        logger.warning(f"Invalid user data in submit_manual_payment: {e}")
        raise HTTPException(status_code=400, detail="Invalid user data")

    try:
        statement = select(Partner).where(Partner.telegram_id == tg_id).with_for_update()
        result = await session.exec(statement)
        partner = result.first()

        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")

        # Prevent multiple exact same hash submissions
        if tx_hash:
            existing_hash = await session.exec(
                select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash.strip())
            )
            if existing_hash.first():
                raise HTTPException(status_code=400, detail="This transaction hash has already been submitted.")

        # Prevent multiple active manual reviews for the same user to avoid UI clutter
        existing_pending = await session.exec(
            select(PartnerTransaction).where(
                PartnerTransaction.partner_id == partner.id,
                PartnerTransaction.status == "manual_review"
            )
        )
        if existing_pending.first():
            raise HTTPException(status_code=400, detail="You already have a pending payment verification. Please wait for admin approval.")

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
        from app.models.audit_log import ActionType
        await audit_service.log_event(
            session=session,
            partner_id=partner.id,
            action_type=ActionType.PAYMENT,
            description="Manual Payment Submitted for Review",
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

        # #comment: Enqueue specialized admin notification task.
        # This replaces the flaky asyncio.create_task with a durable broker task.
        try:
            from app.services.notification_service import notify_admin_payment_task
            await notify_admin_payment_task.kiq(
                partner_id=partner.id,
                amount=amount,
                currency=currency,
                network=network,
                tx_hash=tx_hash,
                transaction_id=transaction.id
            )
        except Exception as e:
            logger.error(f"Failed to enqueue admin payment notification: {e}")

        return {"status": "submitted", "message": "Payment submitted for manual review. Admins have been notified."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in submit_manual_payment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error processing payment")

@router.get("/my-transactions")
async def get_my_transactions(
    user_data: dict | None = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Returns the latest transactions for the current user."""
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        tg_user = get_tg_user(user_data)
        tg_id = str(tg_user.get("id"))
    except Exception as e:
        logger.warning(f"Invalid user data in get_my_transactions: {e}")
        raise HTTPException(status_code=400, detail="Malformed user data")
    
    partner = (await session.exec(select(Partner).where(Partner.telegram_id == tg_id))).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
        
    stmt = (
        select(PartnerTransaction)
        .where(PartnerTransaction.partner_id == partner.id)
        .order_by(PartnerTransaction.created_at.desc())
        .limit(20)
    )
    result = await session.exec(stmt)
    txs = result.all()
    
    return [
        {
            "id": t.id,
            "amount": t.amount,
            "amount_crypto": t.amount_crypto,
            "currency": t.currency,
            "network": t.network,
            "status": t.status,
            "tx_hash": t.tx_hash,
            "created_at": t.created_at.isoformat()
        } for t in txs
    ]

@router.post("/upgrade-from-balance")
async def upgrade_from_balance(
    plan: str = Body(..., embed=True), # "PRO" or "PRO_PLUS"
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Upgrades a user using their internal balance.
    Minimum balance for PRO: $39, for PRO+: $69.
    """
    try:
        tg_user = get_tg_user(user_data)
        tg_id = str(tg_user.get("id"))
    except Exception as e:
        logger.warning(f"Invalid user data in upgrade_from_balance: {e}")
        raise HTTPException(status_code=400, detail="Invalid user data")

    # LOCK: with_for_update() prevents double-spending balance in high-concurrency scenarios
    statement = select(Partner).where(Partner.telegram_id == tg_id).with_for_update()
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Determine Price
    price = settings.PRO_PRICE_USD if plan == "PRO" else settings.PRO_PLUS_PRICE_USD
    
    # Check if already has the plan or better
    if plan == "PRO" and partner.is_pro:
         raise HTTPException(status_code=400, detail="User is already PRO or higher")
    if plan == "PRO_PLUS" and partner.subscription_plan == "PRO_PLUS_MONTHLY":
         raise HTTPException(status_code=400, detail="User is already PRO+")

    # Process Upgrade
    # We call upgrade_to_pro which handles the logic, commissions, and notifications
    # #comment: We no longer deduct balance here; it's handled inside the retryable service
    # to ensure atomicity in case of transient DB errors.
    await payment_service.upgrade_to_pro(
        session=session,
        partner=partner,
        amount=price,
        currency="BALANCE",
        network="INTERNAL",
        tx_hash=f"BAL_UPG_{partner.id}_{int(datetime.now(UTC).timestamp())}"
    )

    # Note: upgrade_to_pro commits the session
    return {"status": "success", "message": f"Upgraded to {plan} using balance"}
