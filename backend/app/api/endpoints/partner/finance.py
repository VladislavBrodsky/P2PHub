import logging
from datetime import datetime, UTC, timedelta

from typing import cast, Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
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
    # t-ignore: from sqlalchemy import func

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))
    
    partner = (await session.exec(select(Partner).where(Partner.telegram_id == tg_id))).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
        
    now = datetime.now(UTC).replace(tzinfo=None)
    threshold_72h = now - timedelta(hours=72)
    
    # 1. Fetch recent history (Last 72h) - Limit results to 50 for UI performance
    # INCOME
    stmt_income = (
        select(Earning)
        .where(Earning.partner_id == partner.id, Earning.currency.in_(["USDT", "TON"]), Earning.created_at >= threshold_72h)
        .order_by(Earning.created_at.desc())
        .limit(50)
    )
    earnings_72h = (await session.exec(stmt_income)).all()
    
    # OUTCOME
    stmt_outcome = (
        select(PartnerTransaction)
        .where(
            PartnerTransaction.partner_id == partner.id, 
            PartnerTransaction.currency.in_(["USDT", "TON"]), 
            PartnerTransaction.created_at >= threshold_72h
        )
        .order_by(PartnerTransaction.created_at.desc())
        .limit(50)
    )
    transactions_72h = (await session.exec(stmt_outcome)).all()
    
    history_72h = []
    for e in earnings_72h:
        history_72h.append({"type": "INCOME", "amount": e.amount, "currency": e.currency, "description": e.description, "created_at": e.created_at.isoformat()})
            
    for t in transactions_72h:
        if t.network and t.network.upper() in ["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"]: continue
        amt = t.amount_crypto if (t.currency == "TON" and t.amount_crypto is not None) else t.amount
        description = f"Purchase: {t.currency}"
        if t.status == "manual_review": description = f"Review: {t.currency} Payment"
        elif t.status == "pending": description = f"Pending: {t.currency} Payment"
        elif t.status == "failed": description = f"Failed: {t.currency} Payment"
        history_72h.append({"type": "OUTCOME", "amount": amt, "currency": t.currency, "description": description, "status": t.status, "created_at": t.created_at.isoformat()})
            
    history_72h.sort(key=lambda x: x["created_at"], reverse=True)
    
    # 2. Monthly Aggregation (Last 6 months) using SQL GROUP BY
    start_of_6m = (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)).replace(day=1)
    for _ in range(4): start_of_6m = (start_of_6m - timedelta(days=1)).replace(day=1)

    bucket_expr = func.date_trunc('month', Earning.created_at)
    stmt_income_stats = (
        select(bucket_expr, Earning.currency, func.sum(Earning.amount))
        .where(Earning.partner_id == partner.id, Earning.currency.in_(["USDT", "TON"]), Earning.created_at >= start_of_6m)
        .group_by(1, 2)
    )
    income_rows = (await session.execute(stmt_income_stats)).all()
    
    bucket_expr_tx = func.date_trunc('month', PartnerTransaction.created_at)
    stmt_outcome_stats = (
        select(bucket_expr_tx, PartnerTransaction.currency, func.sum(PartnerTransaction.amount))
        .where(
            PartnerTransaction.partner_id == partner.id, 
            PartnerTransaction.currency.in_(["USDT", "TON"]), 
            PartnerTransaction.status == "completed",
            PartnerTransaction.created_at >= start_of_6m
        )
        .group_by(1, 2)
    )
    outcome_rows = (await session.execute(stmt_outcome_stats)).all()

    # Process into structured format
    monthly_history = []
    temp_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(6):
        monthly_history.append({"month": temp_month.strftime("%B %Y"), "timestamp": temp_month.isoformat(), "USDT": {"income": 0.0, "outcome": 0.0}, "TON": {"income": 0.0, "outcome": 0.0}})
        temp_month = (temp_month - timedelta(days=1)).replace(day=1)

    for row in income_rows:
        iso_month = row[0].replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        valid_currencies = ("USDT", "TON")
        for m in monthly_history:
            if m["timestamp"] == iso_month:
                currency = str(row[1])
                if currency in valid_currencies:
                    # Type checking: m[currency] is now guaranteed to be a dict
                    m[currency]["income"] = float(row[2])
                break

                
    for row in outcome_rows:
        iso_month = row[0].replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        valid_currencies = ("USDT", "TON")
        for m in monthly_history:
            if m["timestamp"] == iso_month:
                currency = str(row[1])
                if currency in valid_currencies:
                    m[currency]["outcome"] = float(row[2])
                break

    return {
        "history_72h": history_72h[:50],
        "monthly_stats": monthly_history[0],
        "monthly_history": monthly_history,
        "total_earned": partner.total_earned_usdt,
        "balance": partner.balance
    }
