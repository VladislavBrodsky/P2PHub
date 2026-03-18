import logging
from datetime import datetime, UTC, timedelta

from typing import cast, Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, Earning, XPTransaction, get_session
from app.models.schemas import EarningSchema
from app.models.transaction import PartnerTransaction

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/earnings", response_model=list[EarningSchema])
async def get_my_earnings(
    limit: int = 10,
    currency: str | None = None,
    exclude_xp: bool = False,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        return []

    stmt = select(Earning).where(Earning.partner_id == partner.id)
    if currency:
        stmt = stmt.where(Earning.currency == currency)
    elif exclude_xp:
        stmt = stmt.where(Earning.currency != "XP")
        
    stmt = stmt.order_by(Earning.created_at.desc()).limit(limit)
    result = await session.exec(stmt)
    return result.all()

@router.get("/xp/history")
async def get_my_xp_history(
    limit: int = 50,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        return []

    stmt = select(XPTransaction).where(XPTransaction.partner_id == partner.id).order_by(XPTransaction.created_at.desc()).limit(limit)
    result = await session.exec(stmt)
    return result.all()

@router.get("/finance/stats")
async def get_finance_stats(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))
    
    partner = (await session.exec(select(Partner).where(Partner.telegram_id == tg_id))).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
        
    now = datetime.now(UTC).replace(tzinfo=None)
    threshold_72h = now - timedelta(hours=72)
    start_of_6m = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(5):
        start_of_6m = (start_of_6m - timedelta(days=1)).replace(day=1)
        
    fetch_after = min(start_of_6m, threshold_72h)
    
    earnings = (await session.exec(select(Earning).where(Earning.partner_id == partner.id, Earning.currency.in_(["USDT", "TON"]), Earning.created_at >= fetch_after).order_by(Earning.created_at.desc()))).all()
    transactions = (await session.exec(select(PartnerTransaction).where(PartnerTransaction.partner_id == partner.id, PartnerTransaction.currency.in_(["USDT", "TON"]), PartnerTransaction.created_at >= fetch_after).order_by(PartnerTransaction.created_at.desc()))).all()
    
    history_72h = []
    for e in earnings:
        if e.created_at >= threshold_72h:
            history_72h.append({"type": "INCOME", "amount": e.amount, "currency": e.currency, "description": e.description, "created_at": e.created_at.isoformat()})
            
    for t in transactions:
        if t.created_at >= threshold_72h:
            if t.network and t.network.upper() in ["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"]: continue
            amt = t.amount_crypto if (t.currency == "TON" and t.amount_crypto is not None) else t.amount
            description = f"Purchase: {t.currency}"
            if t.status == "manual_review": description = f"Review: {t.currency} Payment"
            elif t.status == "pending": description = f"Pending: {t.currency} Payment"
            elif t.status == "failed": description = f"Failed: {t.currency} Payment"

            history_72h.append({"type": "OUTCOME", "amount": amt, "currency": t.currency, "description": description, "status": t.status, "created_at": t.created_at.isoformat()})
            
    history_72h.sort(key=lambda x: x["created_at"], reverse=True)
    
    monthly_history = []
    temp_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(6):
        monthly_history.append({"month": temp_month.strftime("%B %Y"), "timestamp": temp_month.isoformat(), "USDT": {"income": 0.0, "outcome": 0.0}, "TON": {"income": 0.0, "outcome": 0.0}})
        temp_month = (temp_month - timedelta(days=1)).replace(day=1)

    for e in earnings:
        # Explicitly cast to Earning to help linter
        e_typed = cast(Earning, e)
        iso_month = e_typed.created_at.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        for m in monthly_history:
            if m["timestamp"] == iso_month:
                currency_data = m.get(e_typed.currency)
                if isinstance(currency_data, dict):
                    currency_data["income"] += e_typed.amount
                break
                
    for t in transactions:
        if t.status != "completed": continue
        if t.network and t.network.upper() in ["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"]: continue
        
        # Explicitly cast to PartnerTransaction to help linter
        t_typed = cast(PartnerTransaction, t)
        iso_month = t_typed.created_at.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        for m in monthly_history:
            if m["timestamp"] == iso_month:
                currency_data = m.get(t_typed.currency)
                if isinstance(currency_data, dict):
                    amt = t_typed.amount_crypto if (t_typed.currency == "TON" and t_typed.amount_crypto is not None) else t_typed.amount
                    currency_data["outcome"] += amt
                break

    return {
        "history_72h": history_72h,
        "monthly_stats": monthly_history[0],
        "monthly_history": monthly_history,
        "total_earned": partner.total_earned_usdt,
        "balance": partner.balance
    }
