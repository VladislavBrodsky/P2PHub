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
    
    # Telegram sends user data as a JSON string in the 'user' field of initData
    import json
    tg_user = {}
    if "user" in user_data:
        try:
            tg_user = json.loads(user_data["user"])
        except:
            tg_user = user_data

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    partner = session.exec(statement).first()
    
    if not partner:
        # Auto-register new partner if not found
        import secrets
        partner = Partner(
            telegram_id=tg_id,
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name"),
            last_name=tg_user.get("last_name"),
            photo_url=tg_user.get("photo_url"),
            referral_code=f"P2P-{secrets.token_hex(4).upper()}"
        )
        session.add(partner)
    else:
        # Update existing partner data
        partner.username = tg_user.get("username", partner.username)
        partner.first_name = tg_user.get("first_name", partner.first_name)
        partner.last_name = tg_user.get("last_name", partner.last_name)
        partner.photo_url = tg_user.get("photo_url", partner.photo_url)
        session.commit()
    session.refresh(partner)
    return partner

@router.get("/recent")
async def get_recent_partners(
    session: Session = Depends(get_session)
):
    from datetime import datetime, timedelta
    one_hour_ago = datetime.utcnow() - timedelta(minutes=60)
    
    statement = select(Partner).where(Partner.created_at >= one_hour_ago).order_by(Partner.created_at.desc()).limit(10)
    partners = session.exec(statement).all()
    
    # If no partners in last hour, just return the last 4 registered anyway so the UI isn't empty
    if not partners:
        statement = select(Partner).order_by(Partner.created_at.desc()).limit(4)
        partners = session.exec(statement).all()
        
    return partners
