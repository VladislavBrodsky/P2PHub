import logging
import random
from datetime import timedelta
from typing import List, Any, cast, Dict

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Earning, Partner, XPTransaction, get_session, SystemSetting
from app.models.schemas import PartnerTopResponse
from app.services.redis_service import redis_service

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
    except Exception as e:
        logger.warning(f"Cache read failed (activity): {e}")

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
        expire_time = 30 + random.randint(-3, 3)
        await redis_service.set_json(cache_key, activity, expire=expire_time)
    except Exception as e:
        logger.warning(f"Cache write failed (activity): {e}")

    return activity

@router.get("/pulse")
async def get_network_pulse(
    limit: int = 20,
    session: AsyncSession = Depends(get_session)
):
    """
    Returns an anonymized feed of high-value system events (upgrades, commissions, referrals)
    for the 'Pulse of the Network' UI component.
    """
    from app.models.audit_log import ActionType, AuditLog

    cache_key = "partners:pulse_v1"
    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning(f"Pulse cache read failed: {e}")

    stmt = (
        select(AuditLog, Partner.first_name, Partner.last_name)
        .join(Partner, AuditLog.partner_id == Partner.id, isouter=True)
        .where(AuditLog.action_type.in_([
            ActionType.UPGRADE, 
            ActionType.COMMISSION, 
            ActionType.REFERRAL,
            ActionType.PAYMENT
        ]))
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    result = await session.exec(stmt)
    rows = result.all()

    pulse = []
    for log, first_name, last_name in rows:
        name = "System"
        if first_name:
            initial = f" {last_name[0]}." if last_name else ""
            name = f"{first_name}{initial}"
        
        pulse_type = "info"
        if log.action_type == ActionType.UPGRADE: pulse_type = "upgrade"
        elif log.action_type == ActionType.COMMISSION: pulse_type = "earning"
        elif log.action_type == ActionType.REFERRAL: pulse_type = "signup"
        elif log.action_type == ActionType.PAYMENT: pulse_type = "payment"

        pulse.append({
            "id": log.id,
            "type": pulse_type,
            "name": name,
            "description": log.description,
            "timestamp": log.created_at.isoformat(),
            "details": log.details
        })

    try:
        await redis_service.set_json(cache_key, pulse, expire=15)
    except Exception as e:
        logger.warning(f"Pulse cache write failed: {e}")

    return pulse

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
        safe_photo_url = p.photo_url
        if safe_photo_url and (
            safe_photo_url.startswith("/images/avatars/") or
            safe_photo_url.startswith("/images/") or
            safe_photo_url.startswith("/avatars/")
        ):
            safe_photo_url = None

        top_data.append({
            "id": p.id,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "username": p.username,
            "photo_file_id": p.photo_file_id,
            "photo_url": safe_photo_url,
            "xp": p.xp,
            "referrals_count": p.referral_count,
            "total_earned_usdt": p.total_earned_usdt,
            "rank": get_rank(p.xp),
            "subscription_plan": p.subscription_plan
        })

    try:
        from app.services.partner_service import ensure_photo_cached
        photo_ids = [p["photo_file_id"] for p in top_data if p.get("photo_file_id")]
        if photo_ids:
            for fid in photo_ids:
                background_tasks.add_task(ensure_photo_cached, fid)
    except Exception as e:
        logger.warning(f"Top partners photo warming failed: {e}")

    try:
        expire_time = 600 + random.randint(-60, 60)
        await redis_service.set_json(cache_key, top_data, expire=expire_time)
    except Exception as e:
        logger.warning(f"Top partners cache write failed: {e}")

    return top_data

@router.get("/orbit-members")
async def get_orbit_members(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches a randomized set of 8 partners for the Community Orbit.
    """
    import time
    from app.utils.ranking import get_rank

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

    window = int(time.time() / (6 * 3600))
    cache_key = f"partners:orbit:v3:{window}"

    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning(f"Orbit members cache read failed: {e}")

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
    for p in partners[:8]:
        picture_url = None
        safe_photo_url = p.photo_url
        if safe_photo_url and (
            safe_photo_url.startswith("/images/avatars/") or
            safe_photo_url.startswith("/images/") or
            safe_photo_url.startswith("/avatars/")
        ):
            safe_photo_url = None

        if p.photo_file_id:
            picture_url = f"/api/partner/photo/{p.photo_file_id}"
        elif safe_photo_url:
            picture_url = safe_photo_url
        else:
            picture_url = DEMO_AVATARS[p.id % len(DEMO_AVATARS)]
        
        orbit_data.append({
            "id": p.id,
            "first_name": p.first_name or "Partner",
            "photo_file_id": p.photo_file_id,
            "picture_url": picture_url,
            "xp": p.xp,
            "rank": get_rank(p.xp)
        })

    if orbit_data:
        try:
            from app.services.partner_service import ensure_photo_cached
            for item in orbit_data:
                if item.get("photo_file_id"):
                    background_tasks.add_task(ensure_photo_cached, item["photo_file_id"])
        except Exception as e:
            logger.warning(f"Orbit photo warming failed: {e}")

    try:
        expire_time = 21600 + random.randint(-1800, 1800)
        await redis_service.set_json(cache_key, orbit_data, expire=expire_time)
    except Exception as e:
        logger.warning(f"Orbit members cache write failed: {e}")

    return orbit_data

@router.get("/recent")
async def get_recent_partners(
    background_tasks: BackgroundTasks,
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """
    Fetches the 10 most recently joined partners for social proof.
    """
    import json
    from datetime import datetime, UTC

    cache_key = "partners:recent_v2"
    db_settings_key = "partners_recent_snapshot"
    count_settings_key = "partners_recent_last_hour_count"
    partners_refresh_window = timedelta(minutes=5)
    count_refresh_window = timedelta(minutes=5)

    try:
        cached = await redis_service.get_json(cache_key)
        if cached:
            return cached
    except Exception as e:
        logger.warning(f"Recent partners cache read failed: {e}")

    snapshot_setting = await session.get(SystemSetting, db_settings_key)
    count_setting = await session.get(SystemSetting, count_settings_key)

    now = datetime.now(UTC).replace(tzinfo=None)
    partners_list: List[Dict[str, Any]] = []
    last_hour_count = 0

    refresh_needed = True
    if snapshot_setting and count_setting:
        if (now - snapshot_setting.updated_at < partners_refresh_window) and \
           (now - count_setting.updated_at < count_refresh_window):
            refresh_needed = False
            try:
                partners_list = cast(List[Dict[str, Any]], json.loads(snapshot_setting.value))
                last_hour_count = int(count_setting.value)
            except Exception:
                refresh_needed = True

    if refresh_needed:
        delta_1h = now - timedelta(hours=1)
        count_stmt = select(func.count(Partner.id)).where(Partner.created_at >= delta_1h)
        last_hour_count = (await session.exec(count_stmt)).one() or 0

        partners_stmt = select(
            Partner.id,
            Partner.first_name,
            Partner.username,
            Partner.photo_file_id,
            Partner.created_at
        ).where(
            Partner.created_at >= delta_1h
        ).order_by(
            Partner.photo_file_id.isnot(None).desc(),
            Partner.created_at.desc()
        ).limit(limit)

        result = await session.exec(partners_stmt)
        partners = result.all()

        if len(partners) < 4:
            already_ids = [p[0] for p in partners]
            stmt_fill = select(
                Partner.id,
                Partner.first_name,
                Partner.username,
                Partner.photo_file_id,
                Partner.created_at
            ).where(
                Partner.id.notin_(already_ids)
            ).order_by(
                Partner.photo_file_id.isnot(None).desc(),
                Partner.created_at.desc()
            ).limit(4 - len(partners))
            fill_result = await session.exec(stmt_fill)
            partners = list(partners) + list(fill_result.all())

        partners_list = []
        for p_id, p_first_name, p_username, p_photo_file_id, p_created_at in partners:
            partners_list.append({
                "id": p_id,
                "first_name": p_first_name,
                "username": p_username,
                "photo_file_id": p_photo_file_id,
                "photo_url": None,
                "created_at": p_created_at.isoformat() if p_created_at else None
            })

        if not snapshot_setting:
            snapshot_setting = SystemSetting(key=db_settings_key, value=json.dumps(partners_list))
        else:
            snapshot_setting.value = json.dumps(partners_list)
            snapshot_setting.updated_at = now
        session.add(snapshot_setting)

        if not count_setting:
            count_setting = SystemSetting(key=count_settings_key, value=str(last_hour_count))
        else:
            count_setting.value = str(last_hour_count)
            count_setting.updated_at = now
        session.add(count_setting)

        await session.commit()

    partners_data = {
        "partners": partners_list[:limit],
        "last_hour_count": last_hour_count
    }

    if refresh_needed and partners_list:
        try:
            from app.services.partner_service import ensure_photo_cached
            priority_photos = [p["photo_file_id"] for p in partners_list[:4] if p.get("photo_file_id")]
            if priority_photos:
                for fid in priority_photos:
                    background_tasks.add_task(ensure_photo_cached, fid)
        except Exception as e:
            logger.warning(f"Photo warming failed: {e}")

    try:
        expire_time = 300 + random.randint(-30, 30)
        await redis_service.set_json(cache_key, partners_data, expire=expire_time)
    except Exception as e:
        logger.warning(f"Recent partners cache write failed: {e}")

    return partners_data

@router.get("/stats/public")
async def get_public_stats():
    """Returns non-sensitive KPIs for the landing page."""
    from app.services.admin_service import admin_service
    return await admin_service.get_public_kpis()
