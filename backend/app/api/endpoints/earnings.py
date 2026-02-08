from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core.security import get_current_user
from app.models.partner import Partner, Earning, get_session
from app.services.redis_service import redis_service
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

    # 1. Try Redis Cache first
    cache_key = f"partner:earnings:{tg_id}"
    try:
        cached_earnings = await redis_service.get_json(cache_key)
        if cached_earnings:
            return cached_earnings
    except Exception:
        pass

    # 2. Query DB
    result = await session.exec(select(Partner).where(Partner.telegram_id == tg_id))
    partner = result.first()
    
    if not partner:
        return []
        
    statement = select(Earning).where(Earning.partner_id == partner.id).order_by(Earning.id.desc()).limit(50)
    result = await session.exec(statement)
    earnings = result.all()
    
    # Transform to serializable dicts
    earnings_data = [e.dict() for e in earnings]
    
    # 3. Store in Redis Cache (expires in 2 minutes for a good balance of freshness/speed)
    try:
        await redis_service.set_json(cache_key, earnings_data, expire=120)
    except Exception:
        pass

    return earnings_data

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
            description="Referral Commission"
        )
        partner.balance += 50.0
        session.add(earning)
        session.add(partner)
        await session.commit()
        
        # Invalidate cache on new earning
        try:
            cache_key = f"partner:earnings:{tg_id}"
            await redis_service.client.delete(cache_key)
            # Also invalidate profile cache to reflect new balance
            await redis_service.client.delete(f"partner:profile:{tg_id}")
        except Exception:
            pass
            
    return {"status": "success"}
