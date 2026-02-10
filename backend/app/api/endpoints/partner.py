from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, get_session, XPTransaction
from app.models.schemas import PartnerResponse, TaskClaimRequest, GrowthMetrics, NetworkStats, EarningSchema, PartnerTopResponse
from sqlmodel import select
from sqlalchemy.orm import selectinload
from app.services.redis_service import redis_service
import json
import secrets
from app.utils.ranking import get_level
from typing import List

router = APIRouter()

@router.get("/me", response_model=PartnerResponse)
async def get_my_profile(
    background_tasks: BackgroundTasks,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Parse Telegram user data securely
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

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
    statement = select(Partner).where(Partner.telegram_id == tg_id).options(
        selectinload(Partner.referrals),
        selectinload(Partner.completed_task_records)
    )
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
        await process_referral_logic.kiq(partner.id)
    else:
        # Update existing profile check (Throttled to once per hour)
        from datetime import datetime, timedelta
        has_changed = False
        now = datetime.utcnow()
        if not partner.updated_at or partner.updated_at < (now - timedelta(hours=1)):
            if tg_user.get("username") != partner.username:
                partner.username = tg_user.get("username"); has_changed = True
            if tg_user.get("first_name") != partner.first_name:
                partner.first_name = tg_user.get("first_name"); has_changed = True
            if tg_user.get("last_name") != partner.last_name:
                partner.last_name = tg_user.get("last_name"); has_changed = True
            if tg_user.get("photo_url") != partner.photo_url:
                partner.photo_url = tg_user.get("photo_url"); has_changed = True
                
            if has_changed:
                partner.updated_at = now
                session.add(partner)
                await session.commit()
                await session.refresh(partner)

    # 2.0.1 Lazy Migration: Fix Referral Code & Path
    migration_needed = False
    
    # Check 1: Fix Legacy Referral Code (if it's just numbers)
    if partner.referral_code and partner.referral_code.isdigit():
        new_code = f"P2P-{secrets.token_hex(4).upper()}"
        print(f"[MIGRATION] Upgrading User {tg_id} code: {partner.referral_code} -> {new_code}")
        partner.referral_code = new_code
        migration_needed = True

    # Check 2: Fix Missing Path (for Tree Stats)
    if not partner.path and partner.referrer_id:
        # We need to fetch referrer to build path
        try:
            r_stmt = select(Partner).where(Partner.id == partner.referrer_id)
            r_res = await session.exec(r_stmt)
            referrer = r_res.first()
            if referrer:
                parent_path = referrer.path or ""
                # Path format: "ancestor.parent"
                partner.path = f"{parent_path}.{referrer.id}".lstrip(".")
                print(f"[MIGRATION] Fixed path for {tg_id}: {partner.path}")
                migration_needed = True
        except Exception as e:
            print(f"[MIGRATION] Path fix failed: {e}")

    if migration_needed:
        session.add(partner)
        await session.commit()
        await session.refresh(partner)
        # Invalidate cache again
        await redis_service.client.delete(f"partner:profile:{tg_id}")

    # 2.0 Hydrate completed_tasks from association table for frontend compatibility BEFORE any commit/refresh
    # We populate the legacy 'completed_tasks' JSON string field temporarily for the response or sync
    task_ids = [pt.task_id for pt in partner.completed_task_records]
    partner.completed_tasks = json.dumps(task_ids)

    # 2.1 Self-healing: Correct level if inconsistent with XP
    correct_level = get_level(partner.xp)
    if partner.level != correct_level:
        print(f"[DEBUG] Correcting level for {tg_id}: {partner.level} -> {correct_level}")
        partner.level = correct_level
        session.add(partner)
        await session.commit()
        await session.refresh(partner)
        # Invalidate cache again since we updated the profile
        await redis_service.client.delete(f"partner:profile:{tg_id}")

    # 4. Store in Redis Cache (expires in 5 minutes)
    try:
        await redis_service.set_json(cache_key, partner.dict(), expire=300)
    except Exception:
        pass
        
    return partner

    return partners_data

@router.get("/top", response_model=List[PartnerTopResponse])
async def get_top_partners(
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the top 5 partners by XP for social proof.
    """
    from app.utils.ranking import get_rank
    
    cache_key = "partners:top"
    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception:
        pass
        
    statement = select(Partner).order_by(Partner.xp.desc()).limit(5).options(selectinload(Partner.referrals))
    result = await session.exec(statement)
    partners = result.all()
    
    top_data = []
    for p in partners:
        top_data.append({
            "id": p.id,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "username": p.username,
            "photo_url": p.photo_url,
            "xp": p.xp,
            "referrals_count": len(p.referrals),
            "rank": get_rank(p.xp)
        })
        
    try:
        await redis_service.set_json(cache_key, top_data, expire=600)
    except Exception:
        pass
        
    return top_data

@router.get("/recent", response_model=List[PartnerResponse])
async def get_recent_partners(
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the 10 most recently joined partners for social proof.
    """
    cache_key = "partners:recent"
    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception:
        pass
        
    statement = select(Partner).order_by(Partner.created_at.desc()).limit(limit)
    result = await session.exec(statement)
    partners = result.all()
    
    # Pre-serialize for cache and return clean models
    partners_data = [p.model_dump() for p in partners]
    
    try:
        await redis_service.set_json(cache_key, partners_data, expire=300)
    except Exception:
        pass
        
    return partners_data

@router.get("/tree", response_model=NetworkStats)
async def get_my_referral_tree(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the 9-level referral tree stats for the current user.
    """
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    # Get partner
    statement = select(Partner).where(Partner.telegram_id == tg_id).options(selectinload(Partner.referrals))
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        return {str(i): 0 for i in range(1, 10)}

    from app.services.partner_service import get_referral_tree_stats
    
    # 2. Use Intelligent Caching (300s TTL)
    cache_key = f"ref_tree_stats:{partner.id}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_referral_tree_stats(session, partner.id),
        expire=300
    )

@router.get("/network/{level}", response_model=List[PartnerResponse])
async def get_network_level_members(
    level: int,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the list of members for a specific level in the 9-level matrix.
    """
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    # Get partner
    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    if not (1 <= level <= 9):
         raise HTTPException(status_code=400, detail="Level must be between 1 and 9")

    from app.services.partner_service import get_referral_tree_members
    
    cache_key = f"ref_tree_members:{partner.id}:{level}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_referral_tree_members(session, partner.id, level),
        expire=300
    )

@router.get("/growth/metrics", response_model=GrowthMetrics)
async def get_growth_metrics(
    timeframe: str = "7D",
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        return {"growth_pct": 0, "current_count": 0, "previous_count": 0}

    from app.services.partner_service import get_network_growth_metrics
    
    cache_key = f"growth_metrics:{partner.id}:{timeframe}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_network_growth_metrics(session, partner.id, timeframe),
        expire=300
    )

@router.get("/growth/chart")
async def get_growth_chart(
    timeframe: str = "7D",
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        return []

    from app.services.partner_service import get_network_time_series
    
    cache_key = f"growth_chart:{partner.id}:{timeframe}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_network_time_series(session, partner.id, timeframe),
        expire=300
    )

@router.post("/tasks/{task_id}/claim", response_model=PartnerResponse)
async def claim_task_reward(
    task_id: str,
    payload: TaskClaimRequest,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))
    xp_reward = payload.xp_reward

    statement = select(Partner).where(Partner.telegram_id == tg_id).options(selectinload(Partner.completed_task_records))
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Check if task already completed in the new table
    already_completed = any(pt.task_id == task_id for pt in partner.completed_task_records)
        
    if not already_completed:
        # 1. Add record to PartnerTask table
        from app.models.partner import PartnerTask
        new_task_completion = PartnerTask(
            partner_id=partner.id,
            task_id=task_id,
            reward_xp=xp_reward
        )
        session.add(new_task_completion)

        # 1.1 Add XP Transaction record
        new_xp_tx = XPTransaction(
            partner_id=partner.id,
            amount=xp_reward,
            type="TASK",
            description=f"Completed Task: {task_id}",
            reference_id=task_id
        )
        session.add(new_xp_tx)

        # 1.2 Unified Transaction: Log Task XP as an Earning
        from app.models.partner import Earning
        task_earning = Earning(
            partner_id=partner.id,
            amount=xp_reward,
            description=f"Task Reward: {task_id}",
            type="TASK_XP",
            currency="XP"
        )
        session.add(task_earning)

        # 2. Update partner stats
        effective_xp = xp_reward * 5 if partner.is_pro else xp_reward
        partner.xp += effective_xp
        partner.level = get_level(partner.xp)
            
        session.add(partner)
        await session.commit()
        await session.refresh(partner)
        
        # 3. Invalidate profile cache
        await redis_service.client.delete(f"partner:profile:{tg_id}")

        # 4. Send Notification
        try:
            from app.core.i18n import get_msg
            from app.services.notification_service import notification_service
            lang = partner.language_code or "en"
            msg = get_msg(lang, "task_completed", reward=int(xp_reward))
            await notification_service.enqueue_notification(chat_id=int(tg_id), text=msg)
        except Exception as e:
            print(f"Failed to send task notification: {e}")

    return partner

@router.get("/earnings", response_model=List[EarningSchema])
async def get_my_earnings(
    limit: int = 10,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the recent earnings history for the current user.
    """
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    # Get partner ID first
    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        return []

    from app.models.partner import Earning
    # Query Earnings table
    stmt = select(Earning).where(Earning.partner_id == partner.id).order_by(Earning.created_at.desc()).limit(limit)
    result = await session.exec(stmt)
    earnings = result.all()
    
    return earnings

@router.get("/xp/history")
async def get_my_xp_history(
    limit: int = 50,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the recent XP transaction history for the current user.
    """
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    # Get partner ID first
    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        return []

    # Query XPTransaction table
    stmt = select(XPTransaction).where(XPTransaction.partner_id == partner.id).order_by(XPTransaction.created_at.desc()).limit(limit)
    result = await session.exec(stmt)
    xp_history = result.all()
    
    return xp_history
