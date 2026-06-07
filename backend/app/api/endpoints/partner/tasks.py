import logging
from datetime import datetime, UTC

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlmodel.ext.asyncio.session import AsyncSession
import sentry_sdk

from app.core.config import settings
from app.core.security import get_current_user, get_tg_user
from app.core.i18n import get_msg
from app.models.partner import Partner, PartnerTask, XPTransaction, Earning, get_session
from app.models.schemas import ActiveTaskResponse, TaskClaimRequest, PartnerResponse
from app.services.redis_service import redis_service
from app.services.notification_service import notification_service
from app.utils.ranking import get_level

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/{task_id}/start", response_model=ActiveTaskResponse)
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

    statement = select(Partner).where(Partner.telegram_id == tg_id).options(selectinload(Partner.completed_task_records))
    result = await session.exec(statement)
    partner = result.first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    existing_task = next((pt for pt in partner.completed_task_records if pt.task_id == task_id), None)
    if existing_task:
        if existing_task.status == "COMPLETED":
             raise HTTPException(status_code=400, detail="Task already completed")
        return ActiveTaskResponse(
            task_id=existing_task.task_id,
            status=existing_task.status,
            initial_metric_value=existing_task.initial_metric_value,
            started_at=existing_task.started_at or datetime.now(UTC).replace(tzinfo=None)
        )

    initial_metric = 0
    if task_type == 'referral':
        initial_metric = partner.referral_count
    elif task_type == 'action':
        initial_metric = partner.checkin_streak

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
    await redis_service.delete_partner_profile(tg_id, partner.id)

    return ActiveTaskResponse(
        task_id=new_task.task_id,
        status=new_task.status,
        initial_metric_value=new_task.initial_metric_value,
        started_at=new_task.started_at
    )

@router.post("/{task_id}/claim", response_model=PartnerResponse)
async def claim_task_reward(
    task_id: str,
    payload: TaskClaimRequest,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    sentry_sdk.add_breadcrumb(category="task", message=f"Attempting to claim reward for task {task_id}", level="info")

    from app.core.tasks import get_task_config
    config = get_task_config(task_id)
    xp_reward = config.get('reward', 0)
    
    if xp_reward <= 0:
         raise HTTPException(status_code=400, detail="Invalid or unsupported task")

    statement = select(Partner).where(Partner.telegram_id == tg_id).options(
        selectinload(Partner.completed_task_records),
        selectinload(Partner.referrals)
    ).with_for_update()
    result = await session.exec(statement)
    partner = result.first()

    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    task_type = config.get('type')
    requirement = config.get('requirement', 0)
    partner_task_record = next((pt for pt in partner.completed_task_records if pt.task_id == task_id), None)
    
    if task_type in ['referral', 'action', 'academy']:
        current_value = 0
        if task_type == 'referral':
            current_value = max(partner.referral_count, len(partner.referrals or []))
        elif task_type == 'action':
            current_value = partner.checkin_streak
        elif task_type == 'academy':
            import json
            try:
                completed_stages = json.loads(partner.completed_stages or "[]")
                current_value = len(completed_stages) if isinstance(completed_stages, list) else 0
            except (json.JSONDecodeError, ValueError):
                current_value = 0
            
        if current_value < requirement:
             raise HTTPException(status_code=400, detail="Requirement not met")
             
    if partner_task_record and partner_task_record.status == "COMPLETED":
         raise HTTPException(status_code=400, detail="Task already completed")

    if not partner_task_record:
        partner_task_record = PartnerTask(
            partner_id=partner.id,
            task_id=task_id,
            status="COMPLETED",
            reward_xp=xp_reward,
            completed_at=datetime.now(UTC).replace(tzinfo=None)
        )
        session.add(partner_task_record)
        if partner.completed_task_records is None: partner.completed_task_records = []
        partner.completed_task_records.append(partner_task_record)
    else:
        partner_task_record.status = "COMPLETED"
        partner_task_record.reward_xp = xp_reward
        partner_task_record.completed_at = datetime.now(UTC).replace(tzinfo=None)
        session.add(partner_task_record)

    effective_xp = xp_reward * (settings.PRO_PLUS_XP_MULTIPLIER if partner.is_pro_plus else (settings.PRO_XP_MULTIPLIER if partner.is_pro else 1))
    
    session.add(XPTransaction(partner_id=partner.id, amount=effective_xp, type="TASK", description=f"Completed Task: {task_id}", reference_id=task_id))
    session.add(Earning(partner_id=partner.id, amount=effective_xp, description=f"Task Reward: {task_id}", type="TASK_XP", currency="XP", reference_id=f"task_{partner.id}_{task_id}"))

    xp_before = partner.xp
    from sqlalchemy import update
    stmt = update(Partner).where(Partner.id == partner.id).values(xp=Partner.xp + effective_xp)
    await session.execute(stmt)
    await session.flush()
    await session.refresh(partner)
    partner.level = get_level(partner.xp)

    from app.services.audit_service import audit_service
    await audit_service.log_task_completion(session=session, partner_id=partner.id, task_id=task_id, xp_amount=effective_xp, xp_before=xp_before, xp_after=partner.xp)

    session.add(partner)
    await session.commit()
    
    # --- POS-COMMIT SIDE EFFECTS ---
    # We do these after commit to ensure they only happen if the DB update succeeded.
    await redis_service.delete_partner_profile(tg_id, partner.id)

    # Synchronize leaderboard post-commit
    from app.services.leaderboard_service import leaderboard_service
    try: 
        await leaderboard_service.increment_score(partner.id, effective_xp, is_test=partner.is_test)
    except Exception as lb_err: 
        logger.error(f"Leaderboard Sync Failed: {lb_err}")

    try:
        lang = partner.language_code or "en"
        msg = get_msg(lang, "task_completed", reward=int(effective_xp))
        await notification_service.send_low_prio(chat_id=str(tg_id), text=msg)
    except Exception as e:
        logger.error(f"Failed to send task notification: {e}")

    from app.services.partner_service import get_partner_full
    partner = await get_partner_full(session, tg_id)

    partner_response = PartnerResponse.from_orm(partner)
    partner_response.is_admin = tg_id in settings.ADMIN_USER_IDS
    from app.services.analytics_service import get_referral_tree_stats
    tree_stats = await get_referral_tree_stats(session, partner.id)
    partner_response.network_size_real = sum(tree_stats.values())
    
    return partner_response
