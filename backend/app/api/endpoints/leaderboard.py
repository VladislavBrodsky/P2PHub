# Leaderboard endpoint with high-performance caching
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, get_session
from app.schemas.leaderboard import LeaderboardPartner
from app.services.leaderboard_service import leaderboard_service

router = APIRouter()

from fastapi import Request

from app.middleware.rate_limit import limiter

logger = logging.getLogger(__name__)

@router.get("/global")
@limiter.limit("20/minute")
async def get_global_leaderboard(
    request: Request,
    limit: int = 20,
    timeframe: str = "all",
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the top partners from Redis for high-speed delivery.
    Timeframes: all (global), monthly, weekly.
    """
    from app.services.redis_service import redis_service

    # Determine if we should serve test leaderboard
    is_test = False
    if user_data:
        try:
            tg_user = get_tg_user(user_data)
            tg_id = str(tg_user.get("id"))
            statement = select(Partner).where(Partner.telegram_id == tg_id)
            result = await session.exec(statement)
            partner = result.first()
            if partner:
                is_test = partner.is_test
        except Exception:
            pass

    # #comment Versioned cache key (v5) to separate Seasons
    cache_prefix = "test:" if is_test else ""
    cache_key = f"leaderboard:{cache_prefix}{timeframe}_hydrated_v5:{limit}"
    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning(f"Leaderboard Cache Read Failed: {e}")

    # 1. Get IDs from Redis
    top_data = None
    try:
        top_data = await leaderboard_service.get_top_partners(limit, timeframe=timeframe, is_test=is_test)
    except Exception as e:
        logger.error(f"Redis Leaderboard Read Failed for {timeframe} (is_test={is_test}): {e}")

    if not top_data:
        # Fallback to DB (only for "all" timeframe, others are Redis-only for speed)
        if timeframe == "all":
            statement = select(Partner).where(Partner.is_test == is_test).order_by(Partner.xp.desc()).limit(limit)
            result = await session.exec(statement)
            partners = result.all()
            data = [LeaderboardPartner(**p.model_dump()).model_dump() for p in partners]
            await redis_service.set_json(cache_key, data, expire=60)
            return data
        return []

    # 2. Extract IDs and Scores
    partner_ids = [int(p_id) for p_id, _ in top_data]
    scores = {int(p_id): score for p_id, score in top_data}

    # 3. Hydrate via Service
    try:
        data = await leaderboard_service.hydrate_leaderboard(partner_ids, scores, session)
        # Cache for 120 seconds (Monthly/Weekly change slower)
        await redis_service.set_json(cache_key, data, expire=120)
    except Exception as e:
        logger.warning(f"Failed to cache leaderboard data: {e}")
        data = []

    return data

@router.get("/me")
@limiter.limit("30/minute")
async def get_my_leaderboard_stats(
    request: Request,
    timeframe: str = "all",
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Returns the current user's rank and relative position for a timeframe.
    """
    try:
        if not user_data:
            raise ValueError("No user data")
        tg_user = get_tg_user(user_data)
        tg_id = str(tg_user.get("id"))
    except (HTTPException, ValueError, AttributeError):
        return {"rank": 0, "xp": 0, "level": 1, "referrals": 0}

    from app.services.redis_service import redis_service
    cache_key = f"leaderboard:me:{timeframe}:{tg_id}"

    async def fetch_user_stats():
        # Get partner from DB
        statement = select(Partner).where(Partner.telegram_id == tg_id)
        result = await session.exec(statement)
        partner = result.first()

        if not partner:
            return {"rank": -1, "xp": 0, "level": 1, "referrals": 0}

        # Get rank from Redis (0-indexed, so add 1)
        try:
            from datetime import datetime, UTC
            is_test = partner.is_test
            rank = await leaderboard_service.get_partner_rank(partner.id, timeframe=timeframe, is_test=is_test)
            
            # #comment Phase 2 Scaling: Self-Healing. 
            # If user is missing from Redis (e.g. not in top 1000 warmup), 
            # we lazily re-inject them to ensure their rank is always visible.
            if rank is None and timeframe == "all":
                await leaderboard_service.update_score(partner.id, partner.xp, is_test=is_test)
                rank = await leaderboard_service.get_partner_rank(partner.id, timeframe=timeframe, is_test=is_test)

            rank_val = -1
            if rank is not None:
                rank_val = int(rank) + 1
            
            # Get specific XP for this timeframe from Redis directly
            now = datetime.now(UTC)
            if timeframe == "weekly":
                key = f"leaderboard:{'test:' if is_test else ''}weekly:{now.year}-{now.isocalendar()[1]}"
            elif timeframe == "monthly":
                key = f"leaderboard:{'test:' if is_test else ''}monthly:{now.year}-{now.month}"
            else:
                key = leaderboard_service.TEST_LEADERBOARD_KEY if is_test else leaderboard_service.LEADERBOARD_KEY
                
            season_xp = await redis_service.client.zscore(key, str(partner.id))
            
            display_xp = 0.0
            if season_xp is not None:
                display_xp = float(season_xp)
            elif timeframe == "all":
                display_xp = float(partner.xp)
                
        except Exception as e:
            logger.error(f"Rank/XP Read Failed for {timeframe}: {e}")
            rank_val = -1
            display_xp = partner.xp if timeframe == "all" else 0.0

        return {
            "rank": rank_val,
            "xp": display_xp,
            "level": partner.level,
            "referrals": partner.referral_count
        }


    from datetime import UTC, datetime  # Ensure imported for local function
    return await redis_service.get_or_compute(cache_key, fetch_user_stats, expire=60)
