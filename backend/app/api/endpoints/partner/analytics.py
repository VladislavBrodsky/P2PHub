import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user, get_tg_user
from app.middleware.rate_limit import limiter
from app.models.partner import Partner, get_session
from app.models.schemas import NetworkStats, PartnerResponse, GrowthMetrics
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/tree", response_model=NetworkStats)
@limiter.limit("60/minute")
async def get_my_referral_tree(
    request: Request,
    target_id: int | None = None,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id).options(selectinload(Partner.referrals))
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        return {str(i): 0 for i in range(1, 21)}

    query_id = partner.id
    if target_id and target_id != partner.id:
        target_partner = await session.get(Partner, target_id)
        if not target_partner:
            raise HTTPException(status_code=404, detail="Target partner not found")
        
        our_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
        target_path = f"{target_partner.path or ''}.{target_partner.id}".lstrip(".")
        if not target_path.startswith(our_path):
            raise HTTPException(status_code=403, detail="Partner not in your downline")
        query_id = target_id

    from app.services.analytics_service import get_referral_tree_stats
    cache_key = f"ref_tree_stats_v2:{query_id}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_referral_tree_stats(session, query_id),
        expire=3600
    )

@router.get("/network/{level}", response_model=list[PartnerResponse])
async def get_network_level_members(
    level: int,
    target_id: int | None = None,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    if not (1 <= level <= 20):
         raise HTTPException(status_code=400, detail="Level must be between 1 and 20")

    query_id = partner.id
    if target_id and target_id != partner.id:
        target_partner = await session.get(Partner, target_id)
        if not target_partner:
            raise HTTPException(status_code=404, detail="Target partner not found")
        
        our_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
        target_path = f"{target_partner.path or ''}.{target_partner.id}".lstrip(".")
        if not target_path.startswith(our_path):
            raise HTTPException(status_code=403, detail="Partner not in your downline")
        query_id = target_id

    from app.services.analytics_service import get_referral_tree_members
    cache_key = f"ref_tree_members_v2:{query_id}:{level}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_referral_tree_members(session, query_id, level),
        expire=3600
    )

@router.get("/growth/metrics", response_model=GrowthMetrics)
@limiter.limit("30/minute")
async def get_growth_metrics(
    request: Request,
    timeframe: str = "7D",
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        return {"growth_pct": 0, "current_count": 0, "previous_count": 0}

    from app.services.analytics_service import get_network_growth_metrics
    cache_key = f"growth_metrics:{partner.id}:{timeframe}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_network_growth_metrics(session, partner.id, timeframe),
        expire=3600
    )

@router.get("/growth/chart")
@limiter.limit("30/minute")
async def get_growth_chart(
    request: Request,
    timeframe: str = "7D",
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        return []

    from app.services.analytics_service import get_network_time_series
    cache_key = f"growth_chart:{partner.id}:{timeframe}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_network_time_series(session, partner.id, timeframe),
        expire=3600
    )
