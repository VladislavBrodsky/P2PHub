import logging
import random
import secrets
from datetime import datetime, UTC, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import text

from app.core.config import settings
from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, XPTransaction, Earning, get_session
from app.models.schemas import PartnerResponse, LanguageUpdate, NotificationsUpdate
from app.services.redis_service import redis_service
from app.utils.ranking import get_level
from bot import bot, types

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/me", response_model=PartnerResponse)
async def get_my_profile(
    background_tasks: BackgroundTasks,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    if not user_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    cache_key = f"partner:profile:v4:{tg_id}"
    try:
        cached_partner = await redis_service.get_json(cache_key)
        if cached_partner:
            # Only return cache if it has our new field; otherwise bust and re-fetch
            if "network_size_real" in cached_partner:
                # #comment: CRITICAL - Re-validate into model to ensure @computed_field fields are present
                return PartnerResponse.model_validate(cached_partner)
            else:
                # Stale cache — delete and re-fetch
                await redis_service.client.delete(cache_key)
    except Exception as e:
        logger.warning(f"Profile cache read failed for {tg_id}: {e}")

    from app.services.partner_service import create_partner

    stmt = select(Partner).where(Partner.telegram_id == tg_id).options(
        selectinload(Partner.completed_task_records),
        selectinload(Partner.referrals)
    )
    result = await session.exec(stmt)
    partner = result.first()

    is_new = False
    if not partner:
        photo_file_id = None
        try:
            user_photos = await bot.get_user_profile_photos(tg_id, limit=1)
            if user_photos.total_count > 0:
                photo_file_id = user_photos.photos[0][0].file_id
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
        stmt_refresh = select(Partner).where(Partner.id == partner.id).options(
            selectinload(Partner.completed_task_records)
        )
        partner = (await session.exec(stmt_refresh)).one()

    commit_needed = False
    if not is_new:
        now = datetime.now(UTC).replace(tzinfo=None)
        if not partner.updated_at or partner.updated_at < (now - timedelta(hours=1)):
            has_changed = False
            for field in ["username", "first_name", "last_name", "language_code"]:
                if tg_user.get(field) != getattr(partner, field):
                    setattr(partner, field, tg_user.get(field))
                    has_changed = True

            if not partner.photo_file_id:
                from app.services.partner_service import sync_single_photo_background
                background_tasks.add_task(sync_single_photo_background, tg_id)
            else:
                from app.services.partner_service import sync_single_photo_background
                background_tasks.add_task(sync_single_photo_background, tg_id)

            if has_changed:
                partner.updated_at = now
                session.add(partner)
                commit_needed = True

    # Migrations & Self-healing
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
            from app.services.referral_service import process_referral_logic
            await process_referral_logic.kiq(partner.id)

    if partner.depth == 0 and partner.path:
        partner.depth = len(partner.path.split('.'))
        migration_needed = True

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
        commit_needed = True

    # Daily Check-in Logic
    now_dt = datetime.now(UTC).replace(tzinfo=None)
    today_date = now_dt.date()
    checkin_ref = f"checkin_{partner.id}_{today_date.strftime('%Y-%m-%d')}"
    existing_checkin_today = (await session.exec(
        select(XPTransaction).where(XPTransaction.reference_id == checkin_ref).limit(1)
    )).first()
    
    if not existing_checkin_today and partner.last_checkin_at:
        last_date = partner.last_checkin_at.date()
        if last_date < today_date:
            if last_date == today_date - timedelta(days=1):
                partner.checkin_streak += 1
            else:
                partner.checkin_streak = 1
            partner.last_checkin_at = now_dt
            
            checkin_xp = settings.DAILY_CHECKIN_XP
            is_streak_milestone = (partner.checkin_streak % 7 == 0)
            bonus_xp = settings.STREAK_7DAY_XP_BONUS if is_streak_milestone else 0
            
            total_reward = checkin_xp + bonus_xp
            if partner.is_pro_plus:
                total_reward *= settings.PRO_PLUS_XP_MULTIPLIER
            elif partner.is_pro:
                total_reward *= settings.PRO_XP_MULTIPLIER
                
            # Atomic XP increment
            partner.xp = Partner.xp + total_reward
            
            session.add(XPTransaction(
                partner_id=partner.id,
                amount=total_reward,
                type="CHECKIN",
                description=f"Daily Check-in Reward {'(7-Day Streak Bonus Included)' if is_streak_milestone else ''}",
                reference_id=checkin_ref
            ))
            session.add(Earning(
                partner_id=partner.id,
                amount=total_reward,
                description=f"Daily Reward {'+ Streak Bonus' if is_streak_milestone else ''}",
                type="DAILY_REWARD",
                currency="XP",
                reference_id=checkin_ref
            ))
            commit_needed = True

    elif not existing_checkin_today:
        partner.checkin_streak = 1
        partner.last_checkin_at = now_dt
        checkin_xp = settings.DAILY_CHECKIN_XP
        if partner.is_pro_plus:
            checkin_xp *= settings.PRO_PLUS_XP_MULTIPLIER
        elif partner.is_pro:
            checkin_xp *= settings.PRO_XP_MULTIPLIER
            
        # Atomic XP increment
        partner.xp = Partner.xp + checkin_xp
        
        session.add(XPTransaction(
            partner_id=partner.id,
            amount=checkin_xp,
            type="CHECKIN",
            description="Daily Check-in Reward",
            reference_id=checkin_ref
        ))
        session.add(Earning(
            partner_id=partner.id,
            amount=checkin_xp,
            description="Daily Check-in Bonus",
            type="DAILY_REWARD",
            currency="XP",
            reference_id=checkin_ref
        ))
        commit_needed = True
        
    if commit_needed:
        await session.commit()
        await session.refresh(partner)
        await redis_service.client.delete(cache_key)
        if not is_new:
             await redis_service.client.delete("partners:recent_v2")

    try:
        from app.services.analytics_service import pre_warm_tree_cache_task
        await pre_warm_tree_cache_task.kiq(partner.id)
    except Exception as e:
        logger.warning(f"Tree pre-warm enqueue failed: {e}")

    partner_response = PartnerResponse.from_orm(partner)
    partner_response.is_admin = tg_id in settings.ADMIN_USER_IDS

    from app.services.analytics_service import get_referral_tree_stats
    tree_stats = await get_referral_tree_stats(session, partner.id)
    partner_response.network_size_real = sum(tree_stats.values())

    try:
        expire_time = 3600 + random.randint(-360, 360)
        # #comment: Ensure @computed_field values are included in the serialized cache
        # We must use context={'include_computed': True} OR serialize it explicitly.
        # In Pydantic v2, model_dump(mode='json') usually includes them if they are computed_fields.
        # But we'll be explicit to be safe.
        data_to_cache = partner_response.model_dump(mode='json')
        
        # Manually ensure computed fields are present if Pydantic skipped them
        if "is_pro_plus" not in data_to_cache:
            data_to_cache["is_pro_plus"] = partner_response.is_pro_plus
        if "total_network_size" not in data_to_cache:
            data_to_cache["total_network_size"] = partner_response.total_network_size
        if "total_earned" not in data_to_cache:
            data_to_cache["total_earned"] = partner_response.total_earned

        await redis_service.set_json(cache_key, data_to_cache, expire=expire_time)
    except Exception as e:
        logger.warning(f"Profile cache write failed: {e}")

    return partner_response

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
    
    if partner:
        partner.language_code = payload.language_code
        session.add(partner)
        await session.commit()
        await redis_service.client.delete(f"partner:profile:{tg_id}")

    return {"status": "ok", "language_code": payload.language_code}
    
@router.post("/notifications")
async def update_notifications(
    payload: NotificationsUpdate,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(statement)
    partner = result.first()
    
    if partner:
        partner.notifications_paused = payload.notifications_paused
        session.add(partner)
        await session.commit()
        await redis_service.client.delete(f"partner:profile:{tg_id}")
        
        from app.services.rate_limit_service import rate_limit_service
        if payload.notifications_paused:
            await rate_limit_service.mark_user_blocked(str(tg_id))
        else:
            await rate_limit_service.unmark_user_blocked(str(tg_id))

    return {"status": "ok", "notifications_paused": payload.notifications_paused}

@router.post("/prepared-share")
async def get_prepared_share_id(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = int(tg_user.get("id"))

    statement = select(Partner).where(Partner.telegram_id == str(tg_id))
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    ref_code = partner.referral_code

    try:
        bot_info = await bot.get_me()
        bot_username = bot_info.username.replace("@", "")
    except Exception as e:
        logger.warning(f"Failed to fetch bot_me: {e}")
        bot_username = "pintopay_probot"

    ref_link = f"https://t.me/{bot_username}?start={ref_code}"

    if settings.WEBHOOK_URL and settings.WEBHOOK_PATH in settings.WEBHOOK_URL:
        base_api_url = settings.WEBHOOK_URL.split(settings.WEBHOOK_PATH)[0].rstrip('/')
    else:
        base_api_url = (settings.FRONTEND_URL or "https://p2phub-production.up.railway.app").rstrip('/')

    photo_url = f"{base_api_url}/images/2026-02-05_03.35.03.webp"

    lang = partner.language_code or "en"
    from app.core.i18n import get_msg
    caption = get_msg(lang, "viral_share_caption")

    rand_id = str(1000 + secrets.randbelow(9000))

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
async def get_partner_photo(request: Request, file_id: str, refresh: bool = False):
    import time
    from fastapi.responses import Response
    from app.services.partner_service import ensure_photo_cached

    start_time = time.time()
    try:
        image_data = await ensure_photo_cached(file_id, force_refresh=refresh)
        elapsed = (time.time() - start_time) * 1000
        
        if image_data:
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
            raise HTTPException(status_code=404, detail="Photo not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in get_partner_photo: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching photo")

@router.post("/notification/seen")
async def mark_notification_seen(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
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
    await redis_service.client.delete(f"partner:profile:{tg_id}")

    return {"status": "ok"}
