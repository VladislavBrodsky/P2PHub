from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.security import get_current_user
from app.models.partner import Partner, get_session

router = APIRouter()

@router.get("/me", response_model=Partner)
async def get_my_profile(
    user_data: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tg_id = str(user_data.get("id"))
    statement = select(Partner).where(Partner.telegram_id == tg_id)
    partner = session.exec(statement).first()
    
    if not partner:
        # Auto-register new partner if not found
        import secrets
        partner = Partner(
            telegram_id=tg_id,
            username=user_data.get("username"),
            first_name=user_data.get("first_name"),
            referral_code=f"P2P-{secrets.token_hex(4).upper()}"
        )
        session.add(partner)
        session.commit()
        session.refresh(partner)
        
    return partner
