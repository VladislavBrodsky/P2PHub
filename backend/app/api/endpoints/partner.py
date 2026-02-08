from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.security import get_current_user
from app.models.partner import Partner, get_session
from sqlmodel import select
from app.services.redis_service import redis_service
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
            tg_user = json.loads(user_data["user"])
        else:
            tg_user = user_data
            
        tg_id = str(tg_user.get("id"))
        if not tg_id or tg_id == "None":
             raise HTTPException(status_code=400, detail="Invalid Telegram ID")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse user data: {str(e)}")

    # 1. Try Redis Cache first
    cache_key = f"partner:profile:{tg_id}"
    try:
        cached_partner = await redis_service.get_json(cache_key)
        if cached_partner:
            print(f"[DEBUG] get_my_profile: Cache Hit for {tg_id}")
            return cached_partner
    except Exception as e:
        print(f"[DEBUG] Redis Error (get): {e}")

    # 2. Query DB
    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        # Check for referrer
        referrer_id = None
        start_param = user_data.get("start_param")
        if start_param:
            try:
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
        
        # Offload notifications & high-scale referral logic
        from app.services.partner_service import process_referral_logic
        from bot import bot
        background_tasks.add_task(process_referral_logic, bot, session, partner)
    else:
        # Update existing profile check
        has_changed = False
        if tg_user.get("username") != partner.username:
            partner.username = tg_user.get("username"); has_changed = True
        if tg_user.get("first_name") != partner.first_name:
            partner.first_name = tg_user.get("first_name"); has_changed = True
        if tg_user.get("last_name") != partner.last_name:
            partner.last_name = tg_user.get("last_name"); has_changed = True
        if tg_user.get("photo_url") != partner.photo_url:
            partner.photo_url = tg_user.get("photo_url"); has_changed = True
            
        if has_changed:
            session.add(partner)
            await session.commit()
            await session.refresh(partner)

    # 3. Store in Redis Cache (expires in 5 minutes)
    try:
        await redis_service.set_json(cache_key, partner.dict(), expire=300)
    except Exception:
        pass
        
    return partner

@router.get("/recent")
async def get_recent_partners(
    session: AsyncSession = Depends(get_session)
):
    # 1. Try Redis Cache first
    cache_key = "partners:recent"
    try:
        cached_partners = await redis_service.get_json(cache_key)
        if cached_partners:
            return cached_partners
    except Exception:
        pass

    # 2. Query DB
    from datetime import datetime, timedelta
    one_hour_ago = datetime.utcnow() - timedelta(minutes=60)
    
    statement = select(Partner).where(Partner.created_at >= one_hour_ago).order_by(Partner.created_at.desc()).limit(10)
    result = await session.exec(statement)
    partners = result.all()
    
    if not partners:
        statement = select(Partner).order_by(Partner.created_at.desc()).limit(4)
        result = await session.exec(statement)
        partners = result.all()
    
    # Transform to dict for JSON serialization
    partners_data = [p.dict() for p in partners]
    
    # 3. Cache in Redis (expires in 60 seconds)
    try:
        await redis_service.set_json(cache_key, partners_data, expire=60)
    except Exception:
        pass
        
    return partners_data
@router.get("/tree")
async def get_my_referral_tree(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the 9-level referral tree stats for the current user.
    Uses hyper-optimized Recursive CTE service logic.
    """
    try:
        if "user" in user_data:
            tg_data = json.loads(user_data["user"])
            tg_id = str(tg_data.get("id"))
        else:
            tg_id = str(user_data.get("id"))
    except:
        return {str(i): 0 for i in range(1, 10)}

    # Get partner
    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        return {str(i): 0 for i in range(1, 10)}

    from app.services.partner_service import get_referral_tree_stats
    stats = await get_referral_tree_stats(session, partner.id)
    
    return stats
