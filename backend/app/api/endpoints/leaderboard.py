from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core.security import get_current_user
from app.models.partner import Partner, get_session
from app.services.leaderboard_service import leaderboard_service
from typing import List, Dict
import json

router = APIRouter()

@router.get("/global")
async def get_global_leaderboard(
    limit: int = 20,
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the top partners from Redis for high-speed delivery.
    Hydrates with partner details from PostgreSQL.
    """
    from app.services.redis_service import redis_service
    
    # Check cache first
    cache_key = f"leaderboard:global_hydrated:{limit}"
    cached = await redis_service.get_json(cache_key)
    if cached:
        return cached

    # 1. Get IDs from Redis
    top_data = await leaderboard_service.get_top_partners(limit)
    if not top_data:
        # Fallback to DB if Redis is cold
        statement = select(Partner).order_by(Partner.xp.desc()).limit(limit)
        result = await session.exec(statement)
        partners = result.all()
        from app.schemas.leaderboard import LeaderboardPartner
        data = [LeaderboardPartner(**p.dict()).model_dump() for p in partners]
        await redis_service.set_json(cache_key, data, expire=60)
        return data

    # 2. Extract IDs and Scores
    partner_ids = [int(p_id) for p_id, _ in top_data]
    scores = {int(p_id): score for p_id, score in top_data}

    # 3. Hydrate via Service
    data = await leaderboard_service.hydrate_leaderboard(partner_ids, scores, session)
    
    # 4. Cache for 60 seconds
    await redis_service.set_json(cache_key, data, expire=60)
    
    return data

@router.get("/me")
async def get_my_leaderboard_stats(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Returns the current user's rank and relative position.
    """
    try:
        if "user" in user_data:
            tg_user = json.loads(user_data["user"])
            tg_id = str(tg_user.get("id"))
        else:
            tg_id = str(user_data.get("id"))
    except:
        return {"rank": -1, "xp": 0}

    # Get partner from DB
    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        return {"rank": -1, "xp": 0}

    # Get rank from Redis (0-indexed, so add 1)
    rank = await leaderboard_service.get_partner_rank(partner.id)
    
    # Get total referral count
    from sqlmodel import func
    count_stmt = select(func.count()).where(Partner.referrer_id == partner.id)
    referral_count = (await session.exec(count_stmt)).one()
    
    return {
        "rank": (rank + 1) if rank is not None else -1,
        "xp": partner.xp,
        "level": partner.level,
        "referrals": referral_count
    }
