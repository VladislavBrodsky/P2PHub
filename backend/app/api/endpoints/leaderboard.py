from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, get_session
from app.services.leaderboard_service import leaderboard_service
from typing import List, Dict
import json

router = APIRouter()

import logging
logger = logging.getLogger(__name__)

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
    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning(f"Leaderboard Cache Read Failed: {e}")

    # 1. Get IDs from Redis
    top_data = None
    try:
        top_data = await leaderboard_service.get_top_partners(limit)
    except Exception as e:
        logger.error(f"Redis Leaderboard Read Failed: {e}")

    if not top_data:
        # Fallback to DB if Redis is cold or down
        statement = select(Partner).order_by(Partner.xp.desc()).limit(limit)
        result = await session.exec(statement)
        partners = result.all()
        from app.schemas.leaderboard import LeaderboardPartner
        data = [LeaderboardPartner(**p.dict()).model_dump() for p in partners]
        
        try:
            await redis_service.set_json(cache_key, data, expire=60)
        except Exception: pass
        
        return data

    # 2. Extract IDs and Scores
    partner_ids = [int(p_id) for p_id, _ in top_data]
    scores = {int(p_id): score for p_id, score in top_data}

    # 3. Hydrate via Service
    data = await leaderboard_service.hydrate_leaderboard(partner_ids, scores, session)
    
    # 4. Cache for 300 seconds (5 minutes)
    try:
        await redis_service.set_json(cache_key, data, expire=300)
    except Exception: pass
    
    return data

@router.get("/me")
async def get_my_leaderboard_stats(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Returns the current user's rank and relative position.
    Cached for 60 seconds to improve performance.
    """
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    from app.services.redis_service import redis_service
    cache_key = f"leaderboard:me:{tg_id}"

    async def fetch_user_stats():
        # Get partner from DB
        statement = select(Partner).where(Partner.telegram_id == tg_id)
        result = await session.exec(statement)
        partner = result.first()
        
        if not partner:
            return {
                "rank": -1,
                "xp": 0,
                "level": 1,
                "referrals": 0
            }

        # Get rank from Redis (0-indexed, so add 1)
        try:
            rank = await leaderboard_service.get_partner_rank(partner.id)
            rank_val = (rank + 1) if rank is not None else -1
        except Exception as e:
            logger.error(f"Rank Read Failed: {e}")
            rank_val = -1
        
        # Get total referral count
        referral_count = partner.referral_count
        
        return {
            "rank": rank_val,
            "xp": partner.xp,
            "level": partner.level,
            "referrals": referral_count
        }

    return await redis_service.get_or_compute(cache_key, fetch_user_stats, expire=60)
