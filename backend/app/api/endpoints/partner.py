from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.security import get_current_user
from app.models.partner import Partner, get_session
from sqlmodel import select
import json
import secrets

router = APIRouter()

@router.get("/me", response_model=Partner)
async def get_my_profile(
    background_tasks: BackgroundTasks,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Parse Telegram user data
    try:
        if "user" in user_data:
            # InitData from Mini App often has 'user' as a JSON string
            tg_user = json.loads(user_data["user"])
        else:
            # Fallback or direct testing
            tg_user = user_data
            
        tg_id = str(tg_user.get("id"))
        if not tg_id or tg_id == "None":
             raise HTTPException(status_code=400, detail="Invalid Telegram ID")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse user data: {str(e)}")

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        # Check for referrer
        referrer_id = None
        start_param = user_data.get("start_param")
        if start_param:
            try:
                # Look up referrer by code
                ref_stmt = select(Partner).where(Partner.referral_code == start_param)
                ref_res = await session.exec(ref_stmt)
                referrer = ref_res.first()
                if referrer:
                    referrer_id = referrer.id
            except Exception as e:
                print(f"Error looking up referrer: {e}")

        # Auto-register new partner
        partner = Partner(
            telegram_id=tg_id,
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name"),
            last_name=tg_user.get("last_name"),
            photo_url=tg_user.get("photo_url"),
            referral_code=f"P2P-{secrets.token_hex(4).upper()}",
            referrer_id=referrer_id
        )
        session.add(partner)
        await session.commit()
        await session.refresh(partner)
        
        # OFFLOAD Notifications to Background
        from app.services.partner_service import process_referral_notifications
        from bot import bot
        background_tasks.add_task(process_referral_notifications, bot, partner, True)
    else:
        # Update existing profile
        has_changed = False
        if tg_user.get("username") != partner.username:
            partner.username = tg_user.get("username")
            has_changed = True
        if tg_user.get("first_name") != partner.first_name:
            partner.first_name = tg_user.get("first_name")
            has_changed = True
        if tg_user.get("last_name") != partner.last_name:
            partner.last_name = tg_user.get("last_name")
            has_changed = True
        if tg_user.get("photo_url") != partner.photo_url:
            partner.photo_url = tg_user.get("photo_url")
            has_changed = True
            
        if has_changed:
            session.add(partner)
            await session.commit()
            await session.refresh(partner)
        
    return partner

@router.get("/recent")
async def get_recent_partners(
    session: AsyncSession = Depends(get_session)
):
    from datetime import datetime, timedelta
    one_hour_ago = datetime.utcnow() - timedelta(minutes=60)
    
    statement = select(Partner).where(Partner.created_at >= one_hour_ago).order_by(Partner.created_at.desc()).limit(10)
    result = await session.exec(statement)
    partners = result.all()
    
    # If no partners in last hour, just return the last 4 registered anyway so the UI isn't empty
    if not partners:
        statement = select(Partner).order_by(Partner.created_at.desc()).limit(4)
        result = await session.exec(statement)
        partners = result.all()
        
    return partners
