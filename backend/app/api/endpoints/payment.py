import json

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user
from app.models.partner import Partner, get_session
from app.services.notification_service import notification_service
from app.services.payment_service import payment_service

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
    except:
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
    except:
        raise HTTPException(status_code=400, detail="Invalid user data")

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    payment_data = await payment_service.create_payment_session(
        session, partner.id, amount, currency, network
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
    except:
        raise HTTPException(status_code=400, detail="Invalid user data")

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    success = await payment_service.verify_ton_transaction(session, partner, tx_hash)

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
    except:
        raise HTTPException(status_code=400, detail="Invalid user data")

    try:
        statement = select(Partner).where(Partner.telegram_id == tg_id)
        result = await session.exec(statement)
        partner = result.first()

        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")

        transaction = await payment_service.create_transaction(
            session, partner.id, amount, currency, network, tx_hash
        )
        transaction.status = "manual_review"
        await session.commit()

        # Notify Admins (Background-style)
        async def notify_admins():
            admin_msg = (
                "🚨 *NEW MANUAL PAYMENT SUBMITTED*\n\n"
                f"👤 *Partner:* {partner.first_name} (@{partner.username})\n"
                f"💰 *Amount:* ${amount} {currency} ({network})\n"
                f"📝 *Hash:* `{tx_hash or 'Not Provided'}`\n\n"
                "Please verify and approve in the Admin Panel."
            )
            for admin_id in settings.ADMIN_USER_IDS:
                try:
                    await notification_service.enqueue_notification(
                        chat_id=int(admin_id),
                        text=admin_msg
                    )
                except Exception:
                    pass
        
        asyncio.create_task(notify_admins())

        return {"status": "submitted", "message": "Payment submitted for manual review"}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

