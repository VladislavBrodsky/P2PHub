from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.security import get_current_user, get_tg_user
from app.core.config import settings
from app.models.partner import Partner, get_session
from app.models.transaction import PartnerTransaction
from app.services.payment_service import payment_service
from app.services.notification_service import notification_service
from app.core.i18n import get_msg
from sqlmodel import select
from typing import List

router = APIRouter()

async def get_current_admin(user_data: dict = Depends(get_current_user)):
    """
    Dependency to verify if the current user is an admin.
    """
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))
    
    if tg_id not in settings.ADMIN_USER_IDS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return tg_user

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

@router.post("/approve-payment/{tx_hash}")
async def approve_payment(
    tx_hash: str,
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Approves a manual payment and triggers user upgrade.
    """
    statement = select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash)
    result = await session.exec(statement)
    tx = result.first()
    
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if tx.status != "manual_review":
        raise HTTPException(status_code=400, detail=f"Transaction is in {tx.status} state, cannot approve")

    # Get the partner
    partner = await session.get(Partner, tx.partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Execute upgrade logic
    success = await payment_service.upgrade_to_pro(
        session=session,
        partner=partner,
        tx_hash=tx.tx_hash,
        currency=tx.currency,
        network=tx.network,
        amount=tx.amount
    )
    
    if success:
        # Notify the User
        try:
            lang = partner.language_code or "en"
            user_msg = get_msg(lang, "pro_welcome")
            await notification_service.enqueue_notification(
                chat_id=int(partner.telegram_id),
                text=f"✅ *PAYMENT APPROVED!*\n\n{user_msg}"
            )
        except Exception as e:
            print(f"[DEBUG] User approval notification failed: {e}")
            
        return {"status": "success", "message": f"Payment {tx_hash} approved for {partner.telegram_id}"}

    else:
        raise HTTPException(status_code=500, detail="Failed to upgrade user to PRO")

@router.post("/reject-payment/{tx_hash}")
async def reject_payment(
    tx_hash: str,
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Rejects a manual payment. Sets status to 'failed' and notifies the user.
    """
    statement = select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash)
    result = await session.exec(statement)
    tx = result.first()
    
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if tx.status != "manual_review":
        raise HTTPException(status_code=400, detail=f"Transaction is in {tx.status} state, cannot reject")

    # Get the partner
    partner = await session.get(Partner, tx.partner_id)
    
    tx.status = "failed"
    session.add(tx)
    await session.commit()
    
    # Notify the User
    if partner:
        try:
            await notification_service.enqueue_notification(
                chat_id=int(partner.telegram_id),
                text="❌ *PAYMENT REJECTED*\n\nYour transaction hash could not be verified. Please check the hash and try again, or contact support."
            )
        except Exception:
            pass
            
    return {"status": "success", "message": f"Payment {tx_hash} rejected"}
