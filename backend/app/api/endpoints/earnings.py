from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.core.security import get_current_user
from app.models.partner import Partner, Earning, get_session
from typing import List

router = APIRouter()

@router.get("/", response_model=List[Earning])
async def get_my_earnings(
    user_data: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tg_id = str(user_data.get("id"))
    partner = session.exec(select(Partner).where(Partner.telegram_id == tg_id)).first()
    
    if not partner:
        return []
        
    statement = select(Earning).where(Earning.partner_id == partner.id).order_by(Earning.id.desc())
    earnings = session.exec(statement).all()
    return earnings

@router.post("/mock")
async def create_mock_earning(
    user_data: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tg_id = str(user_data.get("id"))
    partner = session.exec(select(Partner).where(Partner.telegram_id == tg_id)).first()
    
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
        session.commit()
    return {"status": "success"}
