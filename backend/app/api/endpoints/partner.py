import asyncio
import json
import logging
import random
import secrets

# Added datetime for tracking task start times
from datetime import UTC, datetime, timedelta

import sentry_sdk
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import func, text
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.i18n import get_msg
from app.core.security import get_current_user, get_tg_user
from app.middleware.rate_limit import limiter
from app.models.partner import Earning, Partner, XPTransaction, get_session
from app.models.schemas import (
    ActiveTaskResponse,
    EarningSchema,
    GrowthMetrics,
    LanguageUpdate,
    NetworkStats,
    OrbitMemberResponse,
    PartnerResponse,
    PartnerTopResponse,
    TaskClaimRequest,
)
from app.services.notification_service import notification_service
from app.services.redis_service import redis_service
from app.utils.ranking import get_level
from bot import bot, types

logger = logging.getLogger(__name__)
router = APIRouter()

# #comment: DEPRECATED - Transformation logic moved to app.models.schemas.PartnerResponse
# Manual looping and JSON parsing in endpoints is an anti-pattern. 
# We now use Pydantic's from_attributes + field_validators to handle this automatically.
def prepare_partner_response(partner: Partner, tg_id: str) -> dict:
    """
    DEPRECATED: Use PartnerResponse.model_validate(partner, context={"tg_id": tg_id}) instead.
    Unified transformer to convert Partner model + Relations into PartnerResponse schema.
    """
    from app.models.schemas import PartnerResponse
    # is_admin is the only field requiring external context (tg_id)
    response = PartnerResponse.model_validate(partner)
    response.is_admin = tg_id in settings.ADMIN_USER_IDS
    return response.model_dump()

@router.get("/activity")
async def get_network_activity(
    limit: int = 20,
    session: AsyncSession = Depends(get_session)
):
    """
    Returns the latest 20 XP transactions (joins, tasks, levels) for social proof.
    """
    cache_key = "partners:activity"
    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning(f"Cache read failed (activity): {e}")

    # Optimized: Batch fetch with partner details to avoid N+1
    stmt = (
        select(XPTransaction, Partner.first_name, Partner.username, Partner.photo_file_id)
        .join(Partner, XPTransaction.partner_id == Partner.id)
        .order_by(XPTransaction.created_at.desc())
        .limit(limit)
    )
    result = await session.exec(stmt)
    rows = result.all()

    activity = []
    for tx, first_name, username, photo_file_id in rows:
        activity.append({
            "id": tx.id,
            "type": tx.type,
            "amount": tx.amount,
            "first_name": first_name,
            "username": username,
            "photo_file_id": photo_file_id,
            "timestamp": tx.created_at.isoformat()
        })

    try:
        # Jittered: 30s +/- 3s
        expire_time = 30 + random.randint(-3, 3)
        await redis_service.set_json(cache_key, activity, expire=expire_time)
    except Exception as e:
        logger.warning(f"Cache write failed (activity): {e}")

    return activity

@router.get("/me", response_model=PartnerResponse)
async def get_my_profile(
    background_tasks: BackgroundTasks,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Parse Telegram user data securely
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    # 1. Try Redis Cache first
    cache_key = f"partner:profile:{tg_id}"
    try:
        cached_partner = await redis_service.get_json(cache_key)
        if cached_partner:
            return cached_partner
    except Exception as e:
        logger.warning(f"Profile cache read failed: {e}")

    # 2. Query DB and/or Register
    from app.services.partner_service import create_partner
    from app.services.referral_service import process_referral_notifications

    # Check if photo exists in DB first to avoid blocking Telegram API calls during every /me request
    # Eagerly load all required relations to skip the refetch later
    stmt = select(Partner).where(Partner.telegram_id == tg_id).options(
        selectinload(Partner.completed_task_records),
        selectinload(Partner.referrals)
    )
    result = await session.exec(stmt)
    partner = result.first()

    is_new = False
    if not partner:
        # Capture photo_file_id from Telegram Bot ONLY on registration or if missing
        photo_file_id = None
        try:
            user_photos = await bot.get_user_profile_photos(tg_id, limit=1)
            if user_photos.total_count > 0:
                photo_file_id = user_photos.photos[0][0].file_id
                # Eagerly cache the photo to avoid delay when UI requests it
                try:
                    from app.services.partner_service import ensure_photo_cached
                    background_tasks.add_task(ensure_photo_cached, photo_file_id)
                except Exception as e:
                    logger.warning(f"⚠️ Failed to eager-cache photo for new user {tg_id}: {e}")
        except Exception as e:
            logger.error(f"Failed to fetch photo for {tg_id}: {e}")

        partner, is_new = await create_partner(
            session=session,
            telegram_id=tg_id,
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name"),
            last_name=tg_user.get("last_name"),
            language_code=tg_user.get("language_code", "en"),
            referrer_code=user_data.get("start_param"),
            photo_file_id=photo_file_id
        )
        # Need to refresh with relations after creation
        stmt_refresh = select(Partner).where(Partner.id == partner.id).options(
            selectinload(Partner.completed_task_records)
        )
        partner = (await session.exec(stmt_refresh)).one()

    if is_new:
        pass # Referral logic handled in handle_partner_creation_task background worker
    else:
        # Update profile if changed (Throttled)
        # Update profile if changed (Throttled)
        now = datetime.now(UTC).replace(tzinfo=None)
        if not partner.updated_at or partner.updated_at < (now - timedelta(hours=1)):
            has_changed = False
            for field in ["username", "first_name", "last_name", "language_code"]:
                if tg_user.get(field) != getattr(partner, field):
                    setattr(partner, field, tg_user.get(field))
                    has_changed = True

            # Sync photo specifically if missing or during this throttled window
            # CRITICAL OPTIMIZATION: Move Telegram API calls to background tasks 
            # to prevent blocking the /me response.
            if not partner.photo_file_id:
                # Fire and forget photo sync for new/photo-less users
                from app.services.partner_service import sync_single_photo_background
                background_tasks.add_task(sync_single_photo_background, tg_id)
            else:
                # Throttled background update for existing photos
                from app.services.partner_service import sync_single_photo_background
                background_tasks.add_task(sync_single_photo_background, tg_id)

            if has_changed:
                partner.updated_at = now
                session.add(partner)
                await session.commit()
                await session.refresh(partner)
                # Invalidate cache
                await redis_service.client.delete(cache_key)
                # Invalidate recent partners if this user might be in it
                await redis_service.client.delete("partners:recent_v2")

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
            partner.depth = referrer.depth + 1
            migration_needed = True
            
            # #comment: Self-healing Trigger (Reliability)
            # If path was broken, referral awards likely failed too. 
            # Re-triggering ensures data consistency.
            # Fix: Don't pass session/partner to background task, call kiq directly.
            from app.services.referral_service import process_referral_logic
            await process_referral_logic.kiq(partner.id)

    if partner.depth == 0 and partner.path:
        partner.depth = len(partner.path.split('.'))
        migration_needed = True

    # #comment: CRITICAL FIX for Task System Reliability
    # Ensures referral_count is at least the number of direct referrals.
    # referral_count is the O(1) field used for "Invite X friends" tasks.
    actual_direct_count = len(partner.referrals or [])
    if partner.referral_count < actual_direct_count:
        logger.info(f"🔄 Self-healing stats for partner {partner.id}: referral_count {partner.referral_count} -> {actual_direct_count}")
        partner.referral_count = actual_direct_count
        migration_needed = True

    correct_level = get_level(partner.xp)
    if partner.level != correct_level:
        partner.level = correct_level
        migration_needed = True

    if migration_needed:
        session.add(partner)
        await session.commit()
        await session.refresh(partner)

    # 4. Daily Check-in Logic
    now_dt = datetime.now(UTC).replace(tzinfo=None)
    today_date = now_dt.date()
    
    if partner.last_checkin_at:
        last_date = partner.last_checkin_at.date()
        if last_date < today_date:
            if last_date == today_date - timedelta(days=1):
                partner.checkin_streak += 1
            else:
                partner.checkin_streak = 1
            partner.last_checkin_at = now_dt
            
            # Award XP
            checkin_xp = settings.DAILY_CHECKIN_XP
            
            # 7-Day Streak Bonus
            is_streak_milestone = (partner.checkin_streak % 7 == 0)
            bonus_xp = settings.STREAK_7DAY_XP_BONUS if is_streak_milestone else 0
            
            total_reward = checkin_xp + bonus_xp
            if partner.is_pro_plus:
                total_reward *= settings.PRO_PLUS_XP_MULTIPLIER
            elif partner.is_pro:
                total_reward *= settings.PRO_XP_MULTIPLIER
                
            await session.execute(
                text("UPDATE partner SET xp = xp + :inc WHERE id = :p_id"),
                {"inc": total_reward, "p_id": partner.id}
            )
            
            # Log Base Reward
            session.add(XPTransaction(
                partner_id=partner.id,
                amount=total_reward,
                type="CHECKIN",
                description=f"Daily Check-in Reward {'(7-Day Streak Bonus Included)' if is_streak_milestone else ''}"
            ))
            session.add(Earning(
                partner_id=partner.id,
                amount=total_reward,
                description=f"Daily Reward {'+ Streak Bonus' if is_streak_milestone else ''}",
                type="DAILY_REWARD",
                currency="XP"
            ))
            
            await session.commit()
            await session.refresh(partner)
            await redis_service.client.delete(cache_key)
    else:
        # First check-in
        partner.checkin_streak = 1
        partner.last_checkin_at = now_dt
        
        # Award Daily XP
        checkin_xp = settings.DAILY_CHECKIN_XP
        if partner.is_pro_plus:
            checkin_xp *= settings.PRO_PLUS_XP_MULTIPLIER
        elif partner.is_pro:
            checkin_xp *= settings.PRO_XP_MULTIPLIER
            
        await session.execute(
            text("UPDATE partner SET xp = xp + :inc WHERE id = :p_id"),
            {"inc": checkin_xp, "p_id": partner.id}
        )
        
        session.add(XPTransaction(
            partner_id=partner.id,
            amount=checkin_xp,
            type="CHECKIN",
            description="Daily Check-in Reward"
        ))
        session.add(Earning(
            partner_id=partner.id,
            amount=checkin_xp,
            description="Daily Check-in Bonus",
            type="DAILY_REWARD",
            currency="XP"
        ))
        
        await session.commit()
        await session.refresh(partner)
        await redis_service.client.delete(cache_key)
        
    # 4.5. Pre-warm Referral Tree Stats (Persistent Background)
    # Why: User likely navigates to Partner tab next. Pre-calculating this 
    # saves 100-300ms of wait time on the first tab switch.
    # Fix: Move from BackgroundTasks (flaky with sessions) to TaskIQ worker.
    try:
        from app.services.analytics_service import pre_warm_tree_cache_task
        await pre_warm_tree_cache_task.kiq(partner.id)
    except Exception as e:
        logger.warning(f"Tree pre-warm enqueue failed: {e}")

    # 5. Prepare Response - O(1) using schema-level automation
    # Redundant refetch removed - 'partner' already contains all relations from step 2
    
    from app.models.schemas import PartnerResponse
    partner_response = PartnerResponse.from_orm(partner)
    partner_response.is_admin = tg_id in settings.ADMIN_USER_IDS

    # #comment: CRITICAL - Use mode='json' to ensure datetime objects are serialized (isoformat)
    # before writing to Redis. Without this, json.dumps fails with a TypeError.
    try:
        # Jittered: 300s +/- 30s
        expire_time = 300 + random.randint(-30, 30)
        await redis_service.set_json(cache_key, partner_response.model_dump(mode='json'), expire=expire_time)
    except Exception as e:
        logger.warning(f"Profile cache write failed: {e}")

    return partner_response


@router.get("/top", response_model=list[PartnerTopResponse])
async def get_top_partners(
    background_tasks: BackgroundTasks,
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
    except Exception as e:
        logger.warning(f"Top partners cache read failed: {e}")

    statement = select(Partner).order_by(Partner.xp.desc()).limit(5)
    result = await session.exec(statement)
    partners = result.all()

    top_data = []
    for p in partners:
        # #comment: Deterministic realism injection for social proof (user request)
        # Ensures top partners always appear to have 133-437 members if actual count is low.
        display_refs = p.referral_count
        if display_refs < 133:
            display_refs = 133 + ((p.id * 17) % (437 - 133 + 1))

        top_data.append({
            "id": p.id,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "username": p.username,
            "photo_file_id": p.photo_file_id,
            "photo_url": p.photo_url,
            "xp": p.xp,
            "referrals_count": display_refs,
            "rank": get_rank(p.xp)
        })

    # Background Cache Warming for photos
    try:
        from app.services.partner_service import ensure_photo_cached
        photo_ids = [p["photo_file_id"] for p in top_data if p.get("photo_file_id")]
        if photo_ids:
            for fid in photo_ids:
                background_tasks.add_task(ensure_photo_cached, fid)
    except Exception as e:
        logger.warning(f"Top partners photo warming failed: {e}")

    try:
        # Jittered: 600s +/- 60s
        expire_time = 600 + random.randint(-60, 60)
        await redis_service.set_json(cache_key, top_data, expire=expire_time)
    except Exception as e:
        logger.warning(f"Top partners cache write failed: {e}")

    return top_data

@router.get("/orbit-members", response_model=list[OrbitMemberResponse])
async def get_orbit_members(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches a randomized set of 8 partners for the Community Orbit, 
    rotating every 6 hours to keep the UI fresh.
    """
    import time

    from app.utils.api import get_api_url
    from app.utils.ranking import get_rank

    # Demo avatars to ensure the orbit looks "peopled" even if no photos in DB
    DEMO_AVATARS = [
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=128&h=128&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=128&h=128&fit=crop",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=128&h=128&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=128&h=128&fit=crop"
    ]

    # Calculate 6-hour window identifier
    window = int(time.time() / (6 * 3600))
    cache_key = f"partners:orbit:v3:{window}"

    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning(f"Orbit members cache read failed: {e}")

    # Fetch candidates, prioritizing those with photos to ensure the orbit looks "real"
    statement = (
        select(Partner)
        .order_by(
            Partner.photo_file_id.isnot(None).desc(),
            func.random()
        )
        .limit(12)
    )
    result = await session.exec(statement)
    partners = result.all()

    orbit_data = []
    _base_url = get_api_url()
    
    for i, p in enumerate(partners[:8]):
        # Construct the optimized picture_url
        picture_url = None
        if p.photo_file_id:
            # Use relative paths to let the frontend handle the base URL reliably
            picture_url = f"/api/partner/photo/{p.photo_file_id}"
        elif p.photo_url:
            picture_url = p.photo_url
        else:
            # Inject demo avatar if this specific partner has no photo
            picture_url = DEMO_AVATARS[p.id % len(DEMO_AVATARS)]
        
        orbit_data.append({
            "id": p.id,
            "first_name": p.first_name or "Partner",
            "photo_file_id": p.photo_file_id,
            "picture_url": picture_url,
            "xp": p.xp,
            "rank": get_rank(p.xp)
        })

    # Background Cache Warming
    if orbit_data:
        try:
            from app.services.partner_service import ensure_photo_cached
            for item in orbit_data:
                if item.get("photo_file_id"):
                    background_tasks.add_task(ensure_photo_cached, item["photo_file_id"])
        except Exception as e:
            logger.warning(f"Orbit photo warming failed: {e}")

    try:
        # Jittered: 6h +/- 30m
        expire_time = 21600 + random.randint(-1800, 1800)
        await redis_service.set_json(cache_key, orbit_data, expire=expire_time)
    except Exception as e:
        logger.warning(f"Orbit members cache write failed: {e}")

    return orbit_data

from app.models.partner import SystemSetting


@router.get("/recent")
async def get_recent_partners(
    background_tasks: BackgroundTasks,
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the 10 most recently joined partners for social proof.
    Updated every 5 minutes and persists across restarts.
    """

    cache_key = "partners:recent_v2"
    db_settings_key = "partners_recent_snapshot"
    count_settings_key = "partners_recent_last_hour_count"
    partners_refresh_window = timedelta(minutes=5)
    count_refresh_window = timedelta(hours=1)

    # 1. Try Redis Cache (Fastest)
    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning(f"Recent partners cache read failed: {e}")

    # 2. Check DB Persistence
    snapshot_setting = await session.get(SystemSetting, db_settings_key)
    count_setting = await session.get(SystemSetting, count_settings_key)

    now = datetime.now(UTC).replace(tzinfo=None)
    partners_list = []
    last_hour_count = 0

    # Check if we need to refresh partners list (every 5m)
    refresh_partners = True
    if snapshot_setting:
        if now - snapshot_setting.updated_at < partners_refresh_window:
            refresh_partners = False
            try:
                partners_list = json.loads(snapshot_setting.value)
            except Exception as e:
                # #comment: Invalid JSON in DB snapshot, force refresh.
                logger.warning(f"Failed to parse partner snapshot: {e}")
                refresh_partners = True

    # Check if we need to refresh the randomized count (every 60m)
    refresh_count = True
    if count_setting and now - count_setting.updated_at < count_refresh_window:
        refresh_count = False
        try:
            last_hour_count = int(count_setting.value)
        except:
            refresh_count = True

    if refresh_partners:
        # 3. Fetch Fresh from Partner Table
        # #comment: Prioritize partners with photos and recency to ensure the social proof 
        # badge looks "populated" with real faces as requested.
        statement = select(
            Partner.id,
            Partner.first_name,
            Partner.username,
            Partner.photo_file_id,
            Partner.created_at
        ).order_by(
            Partner.photo_file_id.isnot(None).desc(), # Photos first
            Partner.created_at.desc()
        ).limit(limit)

        result = await session.exec(statement)
        partners = result.all()

        partners_list = []
        for p_id, p_first_name, p_username, p_photo_file_id, p_created_at in partners:
            p_dict = {
                "id": p_id,
                "first_name": p_first_name,
                "username": p_username,
                "photo_file_id": p_photo_file_id,
                "photo_url": None,
                "created_at": p_created_at.isoformat() if p_created_at else None
            }
            partners_list.append(p_dict)

        # Update/Create Snapshot
        if not snapshot_setting:
            snapshot_setting = SystemSetting(key=db_settings_key, value=json.dumps(partners_list))
        else:
            snapshot_setting.value = json.dumps(partners_list)
            snapshot_setting.updated_at = now
        session.add(snapshot_setting)

    if refresh_count:
        # #comment: CRITICAL FIX for Logical Consistency
        # Previously hardcoded to 680-780, which broke logic if total partners < 700.
        # NOW: We fetch actual total count and make hourly join count a reasonable % of it.
        try:
            total_partners = (await session.exec(select(func.count(Partner.id)))).one() or 1
            
            # Real joins in the last hour
            delta_1h = now - timedelta(hours=1)
            real_joins_1h = (await session.exec(select(func.count(Partner.id)).where(Partner.created_at >= delta_1h))).one() or 0
            
            # Dynamic momentum: 3-7% of total network + real joins
            # This simulates a "rolling window" of activity that scales with the project.
            momentum_percent = 0.03 + (secrets.randbelow(4) / 100.0) # 3-7%
            momentum_base = int(total_partners * momentum_percent)
            
            # Ensure at least some number is shown for social proof even in early stages
            last_hour_count = max(real_joins_1h + momentum_base, (total_partners // 20) + 1)
            
            # If total is very small, cap it logically
            if last_hour_count > total_partners:
                last_hour_count = max(1, real_joins_1h)
        except Exception as e:
            logger.warning(f"Failed to calc dynamic hourly count: {e}")
            last_hour_count = 12 # Safe fallback
        
        if not count_setting:
            count_setting = SystemSetting(key=count_settings_key, value=str(last_hour_count))
        else:
            count_setting.value = str(last_hour_count)
            count_setting.updated_at = now
        session.add(count_setting)

    if refresh_partners or refresh_count:
        await session.commit()

    partners_data = {
        "partners": partners_list[:limit],
        "last_hour_count": last_hour_count
    }

    # 4.5. EAGER Photo Cache Warming (Background for first 4 images)
    # This ensures photos are ready BEFORE the frontend requests them without blocking the response
    if refresh_partners and partners_list:
        try:
            from app.services.partner_service import ensure_photo_cached
            # Warm first 4 photos eagerly (these show in the UI immediately)
            priority_photos = [p["photo_file_id"] for p in partners_list[:4] if p.get("photo_file_id")]
            if priority_photos:
                logger.info(f"🔥 Eagerly warming {len(priority_photos)} priority photos in background...")
                # We use a wrapper or multiple tasks to avoid blocking
                for fid in priority_photos:
                    background_tasks.add_task(ensure_photo_cached, fid)
        except Exception as e:
            logger.warning(f"⚠️ Photo warming failed (non-critical): {e}")

    # 5. Populate Redis
    try:
        # Jittered: 300s +/- 30s
        expire_time = 300 + random.randint(-30, 30)
        await redis_service.set_json(cache_key, partners_data, expire=expire_time) # 5 mins
    except Exception as e:
        logger.warning(f"Recent partners cache write failed: {e}")

    return partners_data

@router.get("/stats/public")
async def get_public_stats():
    """Returns non-sensitive KPIs for the landing page."""
    from app.services.admin_service import admin_service
    return await admin_service.get_public_kpis()


@router.get("/tree", response_model=NetworkStats)
@limiter.limit("60/minute")
async def get_my_referral_tree(
    request: Request,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the 20-level referral tree stats for the current user.
    """
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    # Get partner
    statement = select(Partner).where(Partner.telegram_id == tg_id).options(selectinload(Partner.referrals))
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        return {str(i): 0 for i in range(1, 21)}

    from app.services.analytics_service import get_referral_tree_stats

    # 2. Use Intelligent Caching (600s TTL) - V2 Cache Key
    cache_key = f"ref_tree_stats_v2:{partner.id}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_referral_tree_stats(session, partner.id),
        expire=600
    )

@router.get("/network/{level}", response_model=list[PartnerResponse])
async def get_network_level_members(
    level: int,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the list of members for a specific level in the 20-level matrix.
    """
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    # Get partner
    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    if not (1 <= level <= 20):
         raise HTTPException(status_code=400, detail="Level must be between 1 and 20")

    from app.services.analytics_service import get_referral_tree_members

    # V2 Cache Key for robust data refresh
    cache_key = f"ref_tree_members_v2:{partner.id}:{level}"
    return await redis_service.get_or_compute(
        cache_key,
        lambda: get_referral_tree_members(session, partner.id, level),
        expire=600
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
        expire=300
    )

@router.post("/language")
async def update_language(
    payload: LanguageUpdate,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    # Update language preference
    if partner:
        partner.language_code = payload.language_code
        session.add(partner)
        await session.commit()
        await redis_service.client.delete(f"partner:profile:{tg_id}")

    return {"status": "ok", "language_code": payload.language_code}


@router.post("/tasks/{task_id}/start", response_model=ActiveTaskResponse)
async def start_task(
    task_id: str,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    from app.core.tasks import get_task_config
    config = get_task_config(task_id)
    if not config:
        raise HTTPException(status_code=404, detail="Task config not found")

    task_type = config.get('type')
    if task_type not in ['referral', 'action']:
         raise HTTPException(status_code=400, detail="This task type cannot be started manually")

    # Fetch partner with tasks
    statement = select(Partner).where(Partner.telegram_id == tg_id).options(selectinload(Partner.completed_task_records))
    result = await session.exec(statement)
    partner = result.first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Check existing
    existing_task = next((pt for pt in partner.completed_task_records if pt.task_id == task_id), None)
    if existing_task:
        if existing_task.status == "COMPLETED":
             raise HTTPException(status_code=400, detail="Task already completed")
        # Reuse existing started task
        return ActiveTaskResponse(
            task_id=existing_task.task_id,
            status=existing_task.status,
            initial_metric_value=existing_task.initial_metric_value,
            started_at=existing_task.started_at or datetime.now(UTC).replace(tzinfo=None)
        )

    # Snapshot current metric
    initial_metric = 0
    if task_type == 'referral':
        initial_metric = partner.referral_count
    elif task_type == 'action':
        initial_metric = partner.checkin_streak

    from app.models.partner import PartnerTask
    new_task = PartnerTask(
        partner_id=partner.id,
        task_id=task_id,
        status="STARTED",
        started_at=datetime.now(UTC).replace(tzinfo=None),
        initial_metric_value=initial_metric,
        completed_at=None
    )
    session.add(new_task)
    await session.commit()
    await session.refresh(new_task)

    # Invalidate cache
    await redis_service.client.delete(f"partner:profile:{tg_id}")

    return ActiveTaskResponse(
        task_id=new_task.task_id,
        status=new_task.status,
        initial_metric_value=new_task.initial_metric_value,
        started_at=new_task.started_at
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

    sentry_sdk.add_breadcrumb(
        category="task",
        message=f"Attempting to claim reward for task {task_id}",
        level="info"
    )

    # 1. SECURITY FIX: Use backend source of truth for reward and configuration
    from app.core.tasks import get_task_config
    config = get_task_config(task_id)
    xp_reward = config.get('reward', 0)
    
    if xp_reward <= 0:
         raise HTTPException(status_code=400, detail="Invalid or unsupported task")

    statement = select(Partner).where(Partner.telegram_id == tg_id).options(
        selectinload(Partner.completed_task_records),
        selectinload(Partner.referrals)
    )
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # 2. VALIDATION: Check requirements based on task type
    task_type = config.get('type')
    requirement = config.get('requirement', 0)
    
    # Check if task is started
    partner_task_record = next((pt for pt in partner.completed_task_records if pt.task_id == task_id), None)
    
    if task_type in ['referral', 'action', 'academy']:
        # Milestones (Absolute Checks) can be claimed without an explicit STARTED record
        # if the user already met the requirements (e.g. they have 50 referrals).
        
        current_value = 0
        if task_type == 'referral':
            # #comment: Resilient Referral Count Check
            # We use the materialized 'referral_count' field but fallback to the actual relationship count 
            # if the field is lagging or out of sync, ensuring users can ALWAYS claim their hard-earned XP.
            current_value = max(partner.referral_count, len(partner.referrals or []))
        elif task_type == 'action':
            current_value = partner.checkin_streak
        elif task_type == 'academy':
            try:
                completed_stages = json.loads(partner.completed_stages or "[]")
                current_value = len(completed_stages) if isinstance(completed_stages, list) else 0
            except:
                current_value = 0
            
        if current_value < requirement:
             detail_msg = f"Requirement not met. Current: {current_value}/{requirement}"
             if task_type == 'academy':
                 detail_msg = f"Academy milestone not reached: {current_value}/{requirement} stages completed."
             raise HTTPException(status_code=400, detail=detail_msg)
             
    # 3. Check if task already completed in the new table
    if partner_task_record and partner_task_record.status == "COMPLETED":
         raise HTTPException(status_code=400, detail="Task already completed")

    if not partner_task_record:
        # 1. Add record to PartnerTask table (for social tasks that don't have /start)
        from app.models.partner import PartnerTask
        partner_task_record = PartnerTask(
            partner_id=partner.id,
            task_id=task_id,
            status="COMPLETED",
            reward_xp=xp_reward,
            completed_at=datetime.now(UTC).replace(tzinfo=None)
        )
        session.add(partner_task_record)
        # Ensure it's in the collection for response serialization
        if partner.completed_task_records is None:
            partner.completed_task_records = []
        partner.completed_task_records.append(partner_task_record)
    else:
        # Update existing STARTED record
        partner_task_record.status = "COMPLETED"
        partner_task_record.reward_xp = xp_reward
        partner_task_record.completed_at = datetime.now(UTC).replace(tzinfo=None)
        session.add(partner_task_record)

    # 1.1 Calculate effective XP (PRO members get 1.5x, PRO+ get 3x)
    if partner.is_pro_plus:
        effective_xp = xp_reward * settings.PRO_PLUS_XP_MULTIPLIER
    elif partner.is_pro:
        effective_xp = xp_reward * settings.PRO_XP_MULTIPLIER
    else:
        effective_xp = xp_reward
    
    # 1.2 Add XP Transaction record
    new_xp_tx = XPTransaction(
        partner_id=partner.id,
        amount=effective_xp, # Log the actual XP received
        type="TASK",
        description=f"Completed Task: {task_id}",
        reference_id=task_id
    )
    session.add(new_xp_tx)

    # 1.2 Unified Transaction: Log Task XP as an Earning
    task_earning = Earning(
        partner_id=partner.id,
        amount=effective_xp,
        description=f"Task Reward: {task_id}",
        type="TASK_XP",
        currency="XP"
    )
    session.add(task_earning)

    # 2. Update partner stats
    xp_before = partner.xp
    
    # #comment: Explicit Atomic XP Increment using SQLAlchemy update() 
    # This is more robust than raw SQL and handles table name variations/mappings automatically.
    from sqlalchemy import update
    stmt = update(Partner).where(Partner.id == partner.id).values(xp=Partner.xp + effective_xp)
    await session.execute(stmt)
    await session.flush()
    await session.refresh(partner)
    
    partner.level = get_level(partner.xp)

    # Audit logging
    from app.services.audit_service import audit_service
    await audit_service.log_task_completion(
        session=session,
        partner_id=partner.id,
        task_id=task_id,
        xp_amount=effective_xp,
        xp_before=xp_before,
        xp_after=partner.xp
    )

    # 2.1 Sync to Redis Leaderboard
    from app.services.leaderboard_service import leaderboard_service
    try:
        await leaderboard_service.update_score(partner.id, partner.xp)
    except Exception as e:
        logger.error(f"Leaderboard Sync Failed: {e}", exc_info=True)

    # 3. Invalidate profile cache
    await redis_service.client.delete(f"partner:profile:{tg_id}")

    # 4. Send Notification
    try:
        lang = partner.language_code or "en"
        # #comment: Ensure the notification reflects the ACTUAL XP awarded (including PRO multipliers) 
        # to satisfy elite users and provide immediate positive reinforcement.
        msg = get_msg(lang, "task_completed", reward=int(effective_xp))
        await notification_service.enqueue_notification(chat_id=int(tg_id), text=msg)
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"Failed to send task notification: {e}")

    # Final commit for all changes
    session.add(partner)
    await session.commit()
    
    # #comment: Standard hydration using service layer to ensure consistent response preparation
    from app.services.partner_service import get_partner_full
    partner = await get_partner_full(session, tg_id)

    from app.models.schemas import PartnerResponse
    partner_response = PartnerResponse.from_orm(partner)
    partner_response.is_admin = tg_id in settings.ADMIN_USER_IDS
    return partner_response.model_dump()

@router.post("/academy/stages/{stage_id}/complete")
async def complete_academy_stage(
    stage_id: int,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Persists completion of an Academy stage.
    """
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    sentry_sdk.add_breadcrumb(
        category="academy",
        message=f"Attempting to complete academy stage {stage_id}",
        level="info"
    )

    # #comment: Use service-level 'get_partner_full' to eagerly load relationships
    # This prevents 'MissingGreenlet' errors during complex schema mapping.
    from app.services.partner_service import get_partner_full
    partner = await get_partner_full(session, tg_id)

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    try:
        completed = json.loads(partner.completed_stages or "[]")
    except Exception as e:
        # #comment: Corrupt JSON in completed_stages, defaulting to empty list.
        logger.error(f"JSON parse error for partner {partner.id} completed_stages: {e}")
        completed = []

    effective_xp = 0
    if stage_id not in completed:
        completed.append(stage_id)
        partner.completed_stages = json.dumps(completed)
        
        # Award XP based on stage ID
        xp_reward = 0
        if stage_id <= 20:
            xp_reward = 100 + (stage_id - 1) * 50
        else:
            # Stage 20 is 1050 XP. Stage 21 should start at 1150 XP.
            xp_reward = 1150 + (stage_id - 21) * 100
            
        # Apply PRO multiplier (5x)
        effective_xp = xp_reward * 5 if partner.is_pro else xp_reward
        xp_before = partner.xp
        
        # #comment: Explicit Atomic XP Increment using SQLAlchemy update() 
        # This is more robust than raw text SQL and handles table mapping automatically.
        from sqlalchemy import update
        stmt = update(Partner).where(Partner.id == partner.id).values(xp=Partner.xp + effective_xp)
        await session.execute(stmt)
        await session.flush()
        await session.refresh(partner)
        
        # Log XP Transaction
        new_xp_tx = XPTransaction(
            partner_id=partner.id,
            amount=effective_xp,
            type="BONUS",
            description=f"Academy Stage {stage_id} Completed",
            reference_id=f"academy_{stage_id}"
        )
        session.add(new_xp_tx)

        # Log to Earnings (to show in "Recent Earnings")
        from app.models.partner import Earning
        new_earning = Earning(
            partner_id=partner.id,
            amount=effective_xp,
            description=f"Academy Reward (Stage {stage_id})",
            type="TASK_XP",
            currency="XP"
        )
        session.add(new_earning)

        # Audit logging
        from app.services.audit_service import audit_service
        await audit_service.log_task_completion(
            session=session,
            partner_id=partner.id,
            task_id=f"academy_{stage_id}",
            xp_amount=effective_xp,
            xp_before=xp_before,
            xp_after=partner.xp
        )
        
        from app.utils.ranking import get_level
        partner.level = get_level(partner.xp)
        
        session.add(partner)
        await session.commit()
        
        # #comment: Final hydration using service layer ensures all relations are available after commit
        from app.services.partner_service import get_partner_full
        partner = await get_partner_full(session, tg_id)

    from app.models.schemas import PartnerResponse
    partner_response = PartnerResponse.from_orm(partner)
    partner_response.is_admin = tg_id in settings.ADMIN_USER_IDS
    return partner_response.model_dump()

@router.get("/earnings", response_model=list[EarningSchema])
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
@router.post("/prepared-share")
async def get_prepared_share_id(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Pre-generates an inline message ID for 2-tap sharing.
    This uses the Telegram Prepared Inline Messages API.
    """
    tg_user = get_tg_user(user_data)
    tg_id = int(tg_user.get("id"))

    # Need to fetch the partner to get the referral code
    statement = select(Partner).where(Partner.telegram_id == str(tg_id))
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    ref_code = partner.referral_code

    # Cache bot username if needed or replace with hardcoded
    # We can use the same logic as in bot.py
    try:
        bot_info = await bot.get_me()
        bot_username = bot_info.username.replace("@", "")
    except Exception as e:
        # #comment: Network error or bot blocked, fall back to default username.
        logger.warning(f"Failed to fetch bot_me: {e}")
        bot_username = "pintopay_probot"

    ref_link = f"https://t.me/{bot_username}?start={ref_code}"

    # Base URL for assets
    if settings.WEBHOOK_URL and settings.WEBHOOK_PATH in settings.WEBHOOK_URL:
        base_api_url = settings.WEBHOOK_URL.split(settings.WEBHOOK_PATH)[0].rstrip('/')
    else:
        base_api_url = (settings.FRONTEND_URL or "https://p2phub-production.up.railway.app").rstrip('/')

    photo_url = f"{base_api_url}/images/2026-02-05_03.35.03.webp"

    # Fetch language preference
    lang = partner.language_code or "en"
    from app.core.i18n import get_msg
    caption = get_msg(lang, "viral_share_caption")

    # Use a random ID for the prepared message result
    rand_id = str(1000 + secrets.randbelow(9000))

    # Inline query result for the photo card
    result_card = types.InlineQueryResultPhoto(
        id=f"prep_{ref_code}_{rand_id}",
        photo_url=photo_url,
        thumbnail_url=photo_url,
        title="Elite Partner Invitation 💎",
        description="Share your $1/minute strategy",
        caption=caption,
        parse_mode="HTML",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="🤝 Join Partner Club", url=ref_link)]
        ])
    )

    try:
        # Save prepared message
        prepared = await bot.save_prepared_inline_message(
            user_id=tg_id,
            result=result_card,
            allow_user_chats=True,
            allow_bot_chats=True,
            allow_group_chats=True,
            allow_channel_chats=True
        )
        return {"id": prepared.id, "photo_url": photo_url}
    except Exception as e:
        logger.error(f"❌ Failed to save prepared message: {e}", exc_info=True)
        return {"id": ""}


@router.get("/photo/{file_id}")
@limiter.limit("100/minute")
async def get_partner_photo(request: Request, file_id: str):
    """
    Returns the Telegram photo content for a given file_id.
    Optimizes (WebP + Resize) and caches the binary content in Redis.
    """
    import time

    from fastapi.responses import Response

    from app.services.partner_service import ensure_photo_cached

    start_time = time.time()
    try:
        # Use shared service logic which handles caching, fetching, resizing
        image_data = await ensure_photo_cached(file_id)
        elapsed = (time.time() - start_time) * 1000  # ms
        
        if image_data:
            logger.info(f"📸 Photo served for {file_id[:12]}... in {elapsed:.0f}ms")
            return Response(
                content=image_data,
                media_type="image/webp",
                headers={
                    "Cache-Control": "public, max-age=31536000, immutable",
                    "Access-Control-Allow-Origin": "*",
                    "X-Response-Time": f"{elapsed:.0f}ms"
                }
            )
        else:
            logger.warning(f"⚠️ Photo not found: {file_id[:12]}... (took {elapsed:.0f}ms)")
            raise HTTPException(status_code=404, detail="Photo not found or could not be processed")

    except HTTPException:
        raise
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        logger.error(f"❌ Error in get_partner_photo for {file_id[:12]}...: {e} (took {elapsed:.0f}ms)")
        raise HTTPException(status_code=500, detail="Internal server error fetching photo")

@router.post("/notification/seen")
async def mark_notification_seen(
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

    partner.pro_notification_seen = True
    session.add(partner)
    await session.commit()
    await session.refresh(partner)

    # Invalidate cache
    await redis_service.client.delete(f"partner:profile:{tg_id}")

    return {"status": "ok"}
