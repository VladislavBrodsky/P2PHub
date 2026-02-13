from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user, get_tg_user
from app.models.partner import Earning, Partner, get_session
from app.models.schemas import EarningSchema
from app.services.redis_service import redis_service

router = APIRouter()

@router.get("/", response_model=List[EarningSchema])
async def get_my_earnings(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

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
