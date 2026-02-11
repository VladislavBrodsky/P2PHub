import json
import random
import secrets
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user, get_tg_user
from app.middleware.rate_limit import limiter
from app.models.partner import Partner, XPTransaction, get_session
from app.models.schemas import (
    EarningSchema,
    GrowthMetrics,
    NetworkStats,
    PartnerResponse,
    PartnerTopResponse,
    TaskClaimRequest,
)
from app.services.redis_service import redis_service
from app.utils.ranking import get_level
from bot import bot, types
from app.core.tasks import get_task_reward
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

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
    except Exception: pass

    # Fetch latest XP transactions with partner details
    from app.models.partner import Partner, XPTransaction
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
        await redis_service.set_json(cache_key, activity, expire=30) # 30s cache
    except Exception: pass

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
    except Exception: pass

    # 2. Query DB and/or Register
    from app.services.partner_service import (
        create_partner,
        process_referral_notifications,
    )

    # Check if photo exists in DB first to avoid blocking Telegram API calls during every /me request
    # Use selectinload to prevent lazy loading error in async session
    stmt = select(Partner).where(Partner.telegram_id == tg_id).options(
        selectinload(Partner.completed_task_records)
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
        await process_referral_notifications(bot, session, partner, is_new)
    else:
        # Update profile if changed (Throttled)
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        if not partner.updated_at or partner.updated_at < (now - timedelta(hours=1)):
            has_changed = False
            for field in ["username", "first_name", "last_name"]:
                if tg_user.get(field) != getattr(partner, field):
                    setattr(partner, field, tg_user.get(field))
                    has_changed = True

            if has_changed:
                partner.updated_at = now
                session.add(partner)
                await session.commit()
                await session.refresh(partner)
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
    now_dt = datetime.utcnow()
    today_date = now_dt.date()
    
    if partner.last_checkin_at:
        last_date = partner.last_checkin_at.date()
        if last_date < today_date:
            if last_date == today_date - timedelta(days=1):
                # Consecutive day
                partner.checkin_streak += 1
            else:
                # Streak broken
                partner.checkin_streak = 1
            partner.last_checkin_at = now_dt
            session.add(partner)
            await session.commit()
            await session.refresh(partner)
            # Invalidate cache since streak changed
            await redis_service.client.delete(cache_key)
    else:
        # First check-in
        partner.checkin_streak = 1
        partner.last_checkin_at = now_dt
        session.add(partner)
        await session.commit()
        await session.refresh(partner)
        await redis_service.client.delete(cache_key)

    # 5. Prepare Response - O(1) using materialized totals
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
            "photo_file_id": p.photo_file_id,
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

from app.models.partner import SystemSetting, get_session


@router.get("/recent")
async def get_recent_partners(
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the 10 most recently joined partners for social proof.
    Updated every 5 minutes and persists across restarts.
    """
    import random
    from datetime import datetime, timedelta

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
    except Exception:
        pass

    # 2. Check DB Persistence
    snapshot_setting = await session.get(SystemSetting, db_settings_key)
    count_setting = await session.get(SystemSetting, count_settings_key)

    now = datetime.utcnow()
    partners_list = []
    last_hour_count = 0

    # Check if we need to refresh partners list (every 5m)
    refresh_partners = True
    if snapshot_setting:
        if now - snapshot_setting.updated_at < partners_refresh_window:
            refresh_partners = False
            try:
                partners_list = json.loads(snapshot_setting.value)
            except:
                refresh_partners = True

    # Check if we need to refresh the randomized count (every 60m)
    refresh_count = True
    if count_setting:
        if now - count_setting.updated_at < count_refresh_window:
            refresh_count = False
            try:
                last_hour_count = int(count_setting.value)
            except:
                refresh_count = True

    if refresh_partners:
        # 3. Fetch Fresh from Partner Table with photo_file_id
        statement = select(
            Partner.id,
            Partner.first_name,
            Partner.username,
            Partner.photo_file_id,
            Partner.created_at
        ).order_by(Partner.created_at.desc()).limit(limit)

        result = await session.exec(statement)
        partners = result.all()

        partners_list = []
        for p_id, p_first_name, p_username, p_photo_file_id, p_created_at in partners:
            p_dict = {
                "id": p_id,
                "first_name": p_first_name,
                "username": p_username,
                "photo_file_id": p_photo_file_id,
                "photo_url": None,  # Deprecated, keeping for backwards compat
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
        last_hour_count = random.randint(632, 842)
        if not count_setting:
            count_setting = SystemSetting(key=count_settings_key, value=str(last_hour_count))
        else:
            count_setting.value = str(last_hour_count)
            count_setting.updated_at = now
        session.add(count_setting)

    if refresh_partners or refresh_count:
        await session.commit()

    # No need to process photo URLs - we're storing file_ids
    partners_data = {
        "partners": partners_list[:limit],
        "last_hour_count": last_hour_count
    }

    # 5. Populate Redis
    try:
        await redis_service.set_json(cache_key, partners_data, expire=300) # 5 mins
    except Exception:
        pass


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
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

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
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

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
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

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

    # 1. SECURITY FIX: Use backend source of truth for reward and configuration
    from app.core.tasks import get_task_config
    config = get_task_config(task_id)
    xp_reward = config.get('reward', 0)
    
    if xp_reward <= 0:
         raise HTTPException(status_code=400, detail="Invalid or unsupported task")

    statement = select(Partner).where(Partner.telegram_id == tg_id).options(selectinload(Partner.completed_task_records))
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # 2. VALIDATION: Check requirements based on task type
    task_type = config.get('type')
    requirement = config.get('requirement', 0)

    if task_type == 'referral':
        if partner.referral_count < requirement:
            raise HTTPException(status_code=400, detail=f"Requirement not met: {requirement} referrals needed.")
    elif task_type == 'action':
        if partner.checkin_streak < requirement:
            # Maybe the task is recurring or something else, but for now we expect streak
            raise HTTPException(status_code=400, detail=f"Requirement not met: {requirement} day streak needed.")

    # 3. Check if task already completed in the new table
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
    except:
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
    rand_id = str(random.randint(1000, 9999))

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
        print(f"❌ Failed to save prepared message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to prepare share message: {str(e)}")


@router.get("/photo/{file_id}")
@limiter.limit("100/minute")
async def get_partner_photo(request: Request, file_id: str):
    """
    Returns the Telegram photo content for a given file_id.
    Optimizes (WebP + Resize) and caches the binary content in Redis.
    """
    import io

    import httpx
    from fastapi.responses import Response
    from PIL import Image

    cache_key_binary = f"tg_photo_bin_v1:{file_id}"
    cache_key_url = f"tg_photo_url:{file_id}"

    # 1. Try to get from Redis Binary Cache first (Super Fast)
    try:
        cached_binary = await redis_service.get_bytes(cache_key_binary)
        if cached_binary:
            return Response(
                content=cached_binary,
                media_type="image/webp",
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Access-Control-Allow-Origin": "*",
                    "X-Cache": "HIT"
                }
            )
    except Exception as e:
        print(f"⚠️ Binary Cache Read Error: {e}")

    # 2. Get or Refresh Photo URL if not in binary cache
    photo_url = None
    try:
        photo_url = await redis_service.get(cache_key_url)
        if not photo_url:
            try:
                file = await bot.get_file(file_id)
                photo_url = f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file.file_path}"
                await redis_service.set(cache_key_url, photo_url, expire=3600)
            except Exception as e:
                print(f"❌ Telegram API Error for file_id {file_id}: {e}")
                raise HTTPException(status_code=404, detail="Photo not found on Telegram")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Redis/Logic Error in get_partner_photo: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching photo")

    # 3. Fetch, Optimize, and Cache
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(photo_url)
            if response.status_code == 200:
                # Open image with PIL
                img = Image.open(io.BytesIO(response.content))

                # Resize if larger than 128x128
                if img.width > 128 or img.height > 128:
                    img.thumbnail((128, 128), Image.Resampling.LANCZOS)

                # Convert to WebP
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=80)
                optimized_binary = output.getvalue()

                # Cache optimized binary (24 hours)
                try:
                    await redis_service.set_bytes(cache_key_binary, optimized_binary, expire=86400)
                except Exception as e:
                    print(f"⚠️ Failed to cache binary for {file_id}: {e}")

                return Response(
                    content=optimized_binary,
                    media_type="image/webp",
                    headers={
                        "Cache-Control": "public, max-age=31536000, immutable",
                        "Access-Control-Allow-Origin": "*",
                        "X-Cache": "MISS"
                    }
                )
            else:
                print(f"⚠️ Telegram CDN returned {response.status_code} for {photo_url}")
                raise HTTPException(status_code=404, detail="Original photo could not be fetched")

    except Exception as e:
        print(f"❌ Optimization Error: {e}")
        # Fallback to streaming original if optimization fails?
        # Actually, if we're here, we probably can't optimize, so return error
        raise HTTPException(status_code=500, detail="Failed to optimize photo")

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
