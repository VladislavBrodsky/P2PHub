from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, get_session, XPTransaction
from app.models.schemas import PartnerResponse, TaskClaimRequest, GrowthMetrics, NetworkStats, EarningSchema, PartnerTopResponse
from app.core.config import settings
from sqlmodel import select
from sqlalchemy.orm import selectinload
from app.services.redis_service import redis_service
from app.middleware.rate_limit import limiter
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
            return cached_partner
    except Exception: pass

    # 2. Query DB - Optimized: No selectinload(referrals)
    statement = select(Partner).where(Partner.telegram_id == tg_id).options(
        selectinload(Partner.completed_task_records)
    )
    result = await session.exec(statement)
    partner = result.first()
    
    if not partner:
        # Auto-register new partner
        referrer_id = None
        start_param = user_data.get("start_param")
        if start_param:
            ref_stmt = select(Partner).where(Partner.referral_code == start_param)
            ref_res = await session.exec(ref_stmt)
            referrer = ref_res.first()
            if referrer: referrer_id = referrer.id

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
        
        from app.services.partner_service import process_referral_logic
        await process_referral_logic.kiq(partner.id)
    else:
        # Throttled individual profile update
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        if not partner.updated_at or partner.updated_at < (now - timedelta(hours=1)):
            has_changed = False
            for field in ["username", "first_name", "last_name", "photo_url"]:
                if tg_user.get(field) != getattr(partner, field):
                    setattr(partner, field, tg_user.get(field))
                    has_changed = True
            if has_changed:
                partner.updated_at = now
                session.add(partner)
                await session.commit()
                await session.refresh(partner)

    # 3. Handle Lazy Migrations & Self-healing
    migration_needed = False
    if partner.referral_code and partner.referral_code.isdigit():
        partner.referral_code = f"P2P-{secrets.token_hex(4).upper()}"
        migration_needed = True

    if not partner.path and partner.referrer_id:
        r_stmt = select(Partner).where(Partner.id == partner.referrer_id)
        referrer = (await session.exec(r_stmt)).first()
        if referrer:
            partner.path = f"{referrer.path or ''}.{referrer.id}".lstrip(".")
            migration_needed = True

    correct_level = get_level(partner.xp)
    if partner.level != correct_level:
        partner.level = correct_level
        migration_needed = True

    if migration_needed:
        session.add(partner)
        await session.commit()
        await session.refresh(partner)

    # 4. Prepare Response - O(1) using materialized totals
    task_ids = [pt.task_id for pt in partner.completed_task_records]
    partner_dict = partner.model_dump()
    partner_dict["completed_tasks"] = json.dumps(task_ids)
    partner_dict["total_earned"] = partner.total_earned_usdt
    partner_dict["total_network_size"] = partner.referral_count
    partner_dict["is_admin"] = tg_id in settings.ADMIN_USER_IDS

    try:
        await redis_service.set_json(cache_key, partner_dict, expire=300)
    except Exception: pass
        
    return partner_dict

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
        
    statement = select(Partner).order_by(Partner.xp.desc()).limit(5)
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
            "referrals_count": p.referral_count,
            "rank": get_rank(p.xp)
        })
        
    try:
        await redis_service.set_json(cache_key, top_data, expire=600)
    except Exception:
        pass
        
    return top_data

from app.models.partner import Partner, get_session, XPTransaction, SystemSetting

@router.get("/recent")
async def get_recent_partners(
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the 10 most recently joined partners for social proof.
    Updated every 60 minutes and persists across restarts.
    Includes a randomized count of new partners (632-842).
    """
    from datetime import datetime, timedelta
    import random
    
    cache_key = "partners:recent"
    db_settings_key = "partners_recent_snapshot"
    count_settings_key = "partners_recent_last_hour_count"
    refresh_window = timedelta(minutes=5)
    
    # 1. Try Redis Cache (Fastest)
    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception:
        pass

    # 2. Check DB Persistence (For cross-restart/cold starts)
    snapshot_setting = await session.get(SystemSetting, db_settings_key)
    count_setting = await session.get(SystemSetting, count_settings_key)
    
    now = datetime.utcnow()
    should_refresh = True
    
    if snapshot_setting and count_setting:
        # Check if it's still within the 60-minute window
        if now - snapshot_setting.updated_at < refresh_window:
            should_refresh = False
            try:
                partners_list = json.loads(snapshot_setting.value)
                last_hour_count = int(count_setting.value)
                
                partners_data = {
                    "partners": partners_list[:limit],
                    "last_hour_count": last_hour_count
                }
            except Exception:
                should_refresh = True

    if should_refresh:
        # 3. Fetch Fresh from Partner Table
        statement = select(Partner).order_by(Partner.created_at.desc()).limit(limit)
        result = await session.exec(statement)
        partners = result.all()
        partners_list = [p.model_dump() for p in partners]
        last_hour_count = random.randint(632, 842)
        
        # 4. Save to Persistent DB Cache
        if not snapshot_setting:
            snapshot_setting = SystemSetting(key=db_settings_key, value=json.dumps(partners_list))
        else:
            snapshot_setting.value = json.dumps(partners_list)
            snapshot_setting.updated_at = now
            
        if not count_setting:
            count_setting = SystemSetting(key=count_settings_key, value=str(last_hour_count))
        else:
            count_setting.value = str(last_hour_count)
            count_setting.updated_at = now
            
        session.add(snapshot_setting)
        session.add(count_setting)
        await session.commit()
        
        partners_data = {
            "partners": partners_list,
            "last_hour_count": last_hour_count
        }
    
    # 5. Populate Redis for subsequent requests
    try:
        # Cache for 60 mins in Redis too (to match DB refresh window)
        await redis_service.set_json(cache_key, partners_data, expire=3600)
    except Exception:
        pass
        
    return partners_data

@router.get("/tree", response_model=NetworkStats)
@limiter.limit("60/minute")
async def get_my_referral_tree(
    request: Request,
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
@limiter.limit("30/minute")
async def get_growth_metrics(
    request: Request,
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
@limiter.limit("30/minute")
async def get_growth_chart(
    request: Request,
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
        
        # 2.1 Sync to Redis Leaderboard
        from app.services.leaderboard_service import leaderboard_service
        try:
            await leaderboard_service.update_score(partner.id, partner.xp)
        except Exception as e:
            print(f"Leaderboard Sync Failed: {e}")
        
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
