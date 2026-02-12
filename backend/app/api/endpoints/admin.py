from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.i18n import get_msg
from app.core.security import get_current_admin
from app.models.partner import Partner, get_session
from app.models.transaction import PartnerTransaction
from app.services.admin_service import admin_service
from app.services.notification_service import notification_service
from app.services.payment_service import payment_service

router = APIRouter()

@router.get("/stats", response_model=Dict[str, Any])
async def get_admin_stats(
    admin: dict = Depends(get_current_admin)
):
    """
    Returns high-level KPIs and financial data for the admin dashboard.
    """
    return await admin_service.get_dashboard_stats()

@router.get("/pending-payments", response_model=List[PartnerTransaction])
async def list_pending_payments(
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Lists all transactions awaiting manual review.
    """
    statement = select(PartnerTransaction).where(PartnerTransaction.status == "manual_review")
    result = await session.exec(statement)
    return result.all()

@router.post("/approve-payment/{transaction_id}")
async def approve_payment(
    transaction_id: int,
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Approves a manual payment and triggers user upgrade.
    """
    transaction = await session.get(PartnerTransaction, transaction_id)

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.status != "manual_review":
        raise HTTPException(status_code=400, detail=f"Transaction is in {transaction.status} state, cannot approve")

    # Get the partner
    partner = await session.get(Partner, transaction.partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Execute upgrade logic
    success = await payment_service.upgrade_to_pro(
        session=session,
        partner=partner,
        amount=transaction.amount,
        currency=transaction.currency,
        network=transaction.network,
        tx_hash=transaction.tx_hash,
        transaction_id=transaction.id
    )

    if success:
        # Notify the User
        try:
            lang = partner.language_code or "en"
            user_msg = get_msg(lang, "pro_welcome")
            await notification_service.enqueue_notification(
                chat_id=partner.telegram_id,
                text=f"✅ *PAYMENT APPROVED!*\n\n{user_msg}"
            )
        except Exception as e:
            print(f"[DEBUG] User approval notification failed: {e}")

        return {"status": "success", "message": f"Payment {transaction.id} approved for {partner.telegram_id}"}

    else:
        raise HTTPException(status_code=500, detail="Failed to upgrade user to PRO")

@router.post("/reject-payment/{transaction_id}")
async def reject_payment(
    transaction_id: int,
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Rejects a manual payment. Sets status to 'failed' and notifies the user.
    """
    transaction = await session.get(PartnerTransaction, transaction_id)

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.status != "manual_review":
        raise HTTPException(status_code=400, detail=f"Transaction is in {transaction.status} state, cannot reject")

    # Get the partner
    partner = await session.get(Partner, transaction.partner_id)

    transaction.status = "failed"
    session.add(transaction)
    await session.commit()

    # Notify the User
    if partner:
        try:
            await notification_service.enqueue_notification(
                chat_id=partner.telegram_id,
                text="❌ *PAYMENT REJECTED*\n\nYour manual payment confirmation was rejected. Please try again or contact support."
            )
        except Exception:
            pass

    return {"status": "success", "message": f"Payment {transaction_id} rejected"}
