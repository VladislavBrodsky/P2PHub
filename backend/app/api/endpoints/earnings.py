from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core.security import get_current_user
from app.models.partner import Partner, Earning, get_session
from typing import List
import json

router = APIRouter()

@router.get("/", response_model=List[Earning])
async def get_my_earnings(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    try:
        if "user" in user_data:
            tg_user = json.loads(user_data["user"])
            tg_id = str(tg_user.get("id"))
        else:
            tg_id = str(user_data.get("id"))
    except:
        return []

    result = await session.exec(select(Partner).where(Partner.telegram_id == tg_id))
    partner = result.first()
    
    if not partner:
        return []
        
    statement = select(Earning).where(Earning.partner_id == partner.id).order_by(Earning.id.desc())
    result = await session.exec(statement)
    earnings = result.all()
    return earnings

@router.post("/mock")
async def create_mock_earning(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    try:
        if "user" in user_data:
            tg_user = json.loads(user_data["user"])
            tg_id = str(tg_user.get("id"))
        else:
            tg_id = str(user_data.get("id"))
    except:
        return {"status": "error", "message": "Invalid user data"}

    result = await session.exec(select(Partner).where(Partner.telegram_id == tg_id))
    partner = result.first()
    
    if partner:
        earning = Earning(
            partner_id=partner.id,
            amount=50.0,
            description="Referral Commission",
            created_at="2026-02-07T12:00:00"
        )
        partner.balance += 50.0
        session.add(earning)
        session.add(partner)
        await session.commit()
    return {"status": "success"}
