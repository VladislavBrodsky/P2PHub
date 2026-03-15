import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, SystemSetting, get_session
from app.models.schemas import (
    PROSetupRequest,
    ReferralLinkUpdate,
    SocialPostRequest,
    ViralGenerateRequest,
    ViralGenerateResponse,
    GrowthMetrics,
)
from app.services.viral_analytics_service import viral_analytics
from app.services.viral_studio import viral_studio, prompts
from app.services.analytics_service import get_referral_tree_stats, get_network_growth_metrics
from bot import bot

logger = logging.getLogger(__name__)

router = APIRouter()

async def get_current_partner(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Partner:
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))
    
    stmt = select(Partner).where(Partner.telegram_id == tg_id).with_for_update()
    result = await session.exec(stmt)
    partner = result.first()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner

@router.get("/status")
async def get_pro_status(
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    # Check for monthly token reset
    await viral_studio.check_tokens_and_reset(partner, session)
    
    # Parse telegram channels
    import json
    tg_main = ""
    tg_others = []
    
    if partner.telegram_channel_id:
        try:
            if partner.telegram_channel_id.strip().startswith("["):
                channels = json.loads(partner.telegram_channel_id)
                if channels:
                    tg_main = channels[0]
                    tg_others = channels[1:]
            else:
                tg_main = partner.telegram_channel_id
        except Exception:
            tg_main = partner.telegram_channel_id

    return {
        "is_pro": partner.is_pro,
        "is_pro_plus": partner.is_pro_plus,
        "pro_tokens": partner.pro_tokens,
        "academy_score": partner.academy_score,
        "completed_stages": partner.completed_stages,
        "has_x_setup": bool(partner.x_api_key),
        "has_telegram_setup": bool(partner.telegram_channel_id),
        "has_linkedin_setup": bool(partner.linkedin_access_token),
        "has_pinterest_setup": bool(partner.pinterest_access_token),
        "has_threads_setup": bool(partner.threads_access_token),
        "personal_referral_link": partner.personal_referral_link,
        "setup": {
            "x_api_key": partner.x_api_key or "",
            "x_api_secret": partner.x_api_secret or "",
            "x_access_token": partner.x_access_token or "",
            "x_access_token_secret": partner.x_access_token_secret or "",
            "telegram_channel_id": tg_main,
            "telegram_channels": tg_others,
            "linkedin_access_token": partner.linkedin_access_token or "",
            "pinterest_access_token": partner.pinterest_access_token or "",
            "threads_access_token": partner.threads_access_token or "",
            "facebook_access_token": partner.facebook_access_token or "",
            "discord_webhook_url": partner.discord_webhook_url or ""
        },
        "capabilities": viral_studio.get_capabilities(),
        "bot_username": (await bot.get_me()).username
    }

@router.get("/stats")
async def get_pro_stats(
    session: AsyncSession = Depends(get_session)
):
    stmt_sold = select(SystemSetting).where(SystemSetting.key == "pro_slots_sold")
    res_sold = await session.exec(stmt_sold)
    setting_sold = res_sold.first()
    
    stmt_total = select(SystemSetting).where(SystemSetting.key == "pro_slots_total")
    res_total = await session.exec(stmt_total)
    setting_total = res_total.first()
    
    return {
        "sold": int(setting_sold.value) if setting_sold else 147,
        "total": int(setting_total.value) if setting_total else 300
    }

@router.get("/members/avatars")
async def get_pro_member_avatars(
    limit: int = 10,
    session: AsyncSession = Depends(get_session)
):
    """
    Returns a small list of recent PRO / PRO+ member avatars for social proof UI.
    Cached naturally on frontend, fast query on backend.
    """
    from sqlalchemy import or_
    stmt = (
        select(Partner.photo_url, Partner.photo_file_id)
        .where(Partner.is_pro == True)
        .where(or_(Partner.photo_url != None, Partner.photo_file_id != None))
        .order_by(Partner.last_checkin_at.desc())
        .limit(limit)
    )
    result = await session.exec(stmt)
    records = result.all()
    
    valid_avatars = []
    for r in records:
        if r.photo_file_id or (r.photo_url and r.photo_url.strip()):
            valid_avatars.append({
                "url": r.photo_url,
                "file_id": r.photo_file_id
            })
    
    # Fallback to defaults to prevent empty UI
    if len(valid_avatars) < 3:
        defaults = [
            {"url": "https://randomuser.me/api/portraits/women/44.jpg", "file_id": None},
            {"url": "https://randomuser.me/api/portraits/women/68.jpg", "file_id": None},
            {"url": "https://randomuser.me/api/portraits/women/65.jpg", "file_id": None}
        ]
        valid_avatars.extend(defaults[:3 - len(valid_avatars)])
        
    return {"avatars": valid_avatars}

class GrowthAdviceRequest(BaseModel):
    language: str = "en"

@router.post("/growth-advice")
async def get_growth_advice(
    payload: GrowthAdviceRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    """
    PRO EXCELLENCE: Generates personalized network growth advice using AI 
    analyzing real-time network metrics and tree density.
    """
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required for AI Growth Strategist")

    # Audit for tokens - High-stakes advice costs 5 tokens
    has_tokens = await viral_studio.check_tokens_and_reset(partner, session, min_tokens=5)
    if not has_tokens:
        raise HTTPException(status_code=402, detail="Insufficient tokens (5 tokens required for Elite Strategy)")

    # 1. Fetch deep metrics
    tree_stats = await get_referral_tree_stats(session, partner.id)
    growth_7d = await get_network_growth_metrics(session, partner.id, '7D')
    
    # 2. Build contextual prompt
    system_prompt = prompts.build_growth_advice_system_prompt(
        payload.language.capitalize() if payload.language == "en" else "Russian"
    )
    user_prompt = prompts.build_growth_advice_user_prompt(
        partner_level=partner.level,
        xp=partner.xp,
        total_size=sum(tree_stats.values()),
        l1=tree_stats.get('1', 0),
        l2=tree_stats.get('2', 0),
        earned=partner.total_earned_usdt,
        growth_7d=growth_7d['growth_pct'],
        new_members_7d=growth_7d['current_count']
    )
    
    try:
        # Use the flagship model for strategy
        advice_json, _ = await viral_studio._get_text_content(
            system_prompt,
            user_prompt,
            is_pro_plus=True
        )
        
        if not advice_json:
            raise ValueError("Empty response from synthesis engine")

        # Deduct tokens only on success
        partner.pro_tokens -= 5
        session.add(partner)
        await session.commit()
        
        # Robust extraction of the formatted body
        advice_text = advice_json.get("body") or advice_json.get("text")
        if not advice_text and isinstance(advice_json, dict):
            # If AI returned a flat JSON with keys like "analysis" etc, reconstruct it
            advice_text = "\n\n".join([f"## {k.upper()}\n{v}" for k, v in advice_json.items() if k not in ["title", "tokens_remaining"]])
        
        return {
            "advice": advice_text or str(advice_json),
            "tokens_remaining": partner.pro_tokens
        }
    except Exception as e:
        logger.error(f"Growth advice synthesis failed: {e}")
        raise HTTPException(status_code=500, detail="Elite synthesis engine failure. Try again in 5 minutes.")

# Academy Config: Cost (negative) or Reward (positive)
MODULE_DETAILS = {
    "m1": {"tokens": 1, "xp_reward": 500},
    "m2": {"tokens": 1, "xp_reward": 500},
    "m3": {"tokens": -1, "xp_cost": 20, "xp_reward": 2000},
    "m4": {"tokens": -2, "xp_cost": 500, "xp_reward": 5000},
    "m5": {"tokens": -3, "xp_cost": 2000, "xp_reward": 10000},
    "m6": {"tokens": -5, "xp_cost": 10000, "xp_reward": 50000},
}

@router.post("/academy/unlock/{stage_id}")
async def unlock_academy_stage(
    stage_id: str,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    """
    Handles XP-based unlocking of Academy stages after level 20.
    """
    unlocked_raw = json.loads(partner.unlocked_stages or "[]")
    unlocked = [str(s) for s in unlocked_raw] if isinstance(unlocked_raw, list) else []
    
    stage_key = str(stage_id)
    if stage_key in unlocked:
        return {"status": "already_unlocked", "unlocked_stages": unlocked}

    # Determine cost based on stage ID
    xp_cost = 0
    try:
        if stage_id in MODULE_DETAILS:
            xp_cost = MODULE_DETAILS[stage_id].get("xp_cost", 0)
        elif stage_id.isdigit():
            s_id = int(stage_id)
            if s_id > 20:
                # Optimized progression curve
                if s_id == 21: xp_cost = 350
                elif s_id == 22: xp_cost = 500
                elif s_id == 23: xp_cost = 700
                else:
                    # Linear extrapolation from 23 (700) to 70 (7500)
                    # Slope = (7500 - 700) / (70 - 23) approx 145
                    xp_cost = 700 + (s_id - 23) * 145
                    # Round to nearest 50 for cleaner UI
                    xp_cost = round(xp_cost / 50) * 50
    except ValueError:
        pass

    if partner.xp < xp_cost:
        return {
            "status": "insufficient_xp", 
            "required": xp_cost, 
            "current": partner.xp,
            "msg": f"⚠️ ACCESS DENIED! Your network momentum is too low. You need {xp_cost - partner.xp} more XP to unlock this elite knowledge and join the top 1% earners. Go viral or complete tasks to gain access!",
            "cta": "EARN XP NOW"
        }

    # Deduct XP
    partner.xp -= xp_cost
    
    from app.models.partner import XPTransaction
    from app.services.audit_service import audit_service
    
    # Log XP Spend in Ledger
    session.add(XPTransaction(
        partner_id=partner.id,
        amount=-float(xp_cost),
        type="ACADEMY_UNLOCK",
        description=f"Academy Stage {stage_id} Unlocked",
        reference_id=f"acad_unlock_{stage_id}_{partner.id}"
    ))

    await audit_service.log_event(
        session=session,
        partner_id=partner.id,
        action_type="XP_SPEND",
        description=f"Academy Stage {stage_id} Unlocked",
        entity_type="academy",
        entity_id=stage_id,
        action="stage_unlock",
        details={"xp_cost": xp_cost}
    )

    unlocked.append(stage_key)
    partner.unlocked_stages = json.dumps(unlocked)
    
    session.add(partner)
    await session.commit()
    await session.refresh(partner)
    
    return {
        "status": "success",
        "new_xp": partner.xp,
        "unlocked_stages": unlocked
    }

@router.post("/academy/complete/{stage_id}")
async def complete_academy_stage(
    stage_id: str,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    """
    Handles completion of Academy stages. 
    """
    completed_raw = json.loads(partner.completed_stages or "[]")
    completed = [str(s) for s in completed_raw] if isinstance(completed_raw, list) else []
    
    unlocked_raw = json.loads(partner.unlocked_stages or "[]")
    unlocked = [str(s) for s in unlocked_raw] if isinstance(unlocked_raw, list) else []
    
    stage_key = str(stage_id)

    if stage_key in completed:
        return {"status": "already_completed", "academy_score": partner.academy_score}

    # Verification for levels > 20
    if stage_id.isdigit():
        s_id = int(stage_id)
        if s_id > 20 and stage_key not in unlocked:
            return {"status": "locked", "msg": "Stage must be unlocked first"}
    elif stage_id in MODULE_DETAILS and MODULE_DETAILS[stage_id].get("xp_cost", 0) > 0:
        if stage_key not in unlocked:
            return {"status": "locked", "msg": "Module must be unlocked first"}

    # Dynamic Reward Strategy
    xp_reward = 100
    try:
        if stage_id in MODULE_DETAILS:
            xp_reward = MODULE_DETAILS[stage_id].get("xp_reward", 500)
            tokens_reward = MODULE_DETAILS[stage_id].get("tokens", 0)
            if tokens_reward != 0:
                partner.pro_tokens += tokens_reward
        elif stage_id.isdigit():
            s_id = int(stage_id)
            xp_reward = 100 + (s_id * 10)
            if s_id > 20: xp_reward += 500
            if s_id > 50: xp_reward += 2000
            if s_id == 100: xp_reward = 100000
    except ValueError:
        xp_reward = 500

    # Verification: Some stages require a "Mission Task" result
    # For now, we trust the frontend 'Mark as Accomplished' but log it for future audit
    from app.services.audit_service import audit_service
    await audit_service.log_event(
        session=session,
        partner_id=partner.id,
        action_type="XP_AWARD",
        description=f"Academy Stage {stage_id} Completed",
        entity_type="academy",
        entity_id=stage_id,
        action="stage_complete",
        details={"xp_reward": xp_reward}
    )

    # Apply changes
    completed.append(stage_key)
    partner.completed_stages = json.dumps(completed)
    
    # Update Academy Score and Global XP
    partner.academy_score += xp_reward
    partner.xp += xp_reward
    
    from app.models.partner import XPTransaction
    # Log XP Reward in Ledger
    session.add(XPTransaction(
        partner_id=partner.id,
        amount=float(xp_reward),
        type="ACADEMY_REWARD",
        description=f"Academy Stage {stage_id} Completed",
        reference_id=f"acad_comp_{stage_id}_{partner.id}"
    ))

    session.add(partner)
    await session.commit()
    await session.refresh(partner)
    
    return {
        "status": "success", 
        "academy_score": partner.academy_score, 
        "xp_reward": xp_reward,
        "new_xp": partner.xp
    }

@router.post("/setup")
async def setup_social_api(
    payload: PROSetupRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    if payload.x_api_key: partner.x_api_key = payload.x_api_key
    if payload.x_api_secret: partner.x_api_secret = payload.x_api_secret
    if payload.x_access_token: partner.x_access_token = payload.x_access_token
    if payload.x_access_token_secret: partner.x_access_token_secret = payload.x_access_token_secret
    
    # Handle Telegram Channels (Main + Others)
    # If payload acts as full update, we reconstruct the list
    if payload.telegram_channel_id is not None:
        import json
        main_channel = payload.telegram_channel_id
        other_channels = payload.telegram_channels or []
        
        # Merge and dedup
        all_channels = [main_channel] + [ch for ch in other_channels if ch != main_channel]
        # Filter empty and force unique
        unique_channels = []
        seen = set()
        for ch in all_channels:
            if ch and ch.strip() and ch.strip() not in seen:
                unique_channels.append(ch.strip())
                seen.add(ch.strip())
        
        if len(unique_channels) > 1:
            # Enforce limits: PRO+ can have 5, PRO can have 1
            max_channels = 5 if partner.is_pro_plus else 1
            if len(unique_channels) > max_channels:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Plan limit exceeded. Your plan allows up to {max_channels} channels."
                )
            partner.telegram_channel_id = json.dumps(unique_channels)
        elif len(unique_channels) == 1:
            partner.telegram_channel_id = unique_channels[0]
        else:
            partner.telegram_channel_id = None

    if payload.linkedin_access_token: partner.linkedin_access_token = payload.linkedin_access_token
    if payload.pinterest_access_token: partner.pinterest_access_token = payload.pinterest_access_token
    if payload.threads_access_token: partner.threads_access_token = payload.threads_access_token
    if payload.facebook_access_token: partner.facebook_access_token = payload.facebook_access_token
    if payload.discord_webhook_url: partner.discord_webhook_url = payload.discord_webhook_url
    
    session.add(partner)
    await session.commit()
    await session.refresh(partner)
    
    return {"status": "success"}

@router.post("/referral-link")
async def update_referral_link(
    payload: ReferralLinkUpdate,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    link = payload.referral_link.strip()
    
    # Validation: Must match "https://t.me/pintopaybot?start=" or "t.me/pintopaybot?start="
    is_valid = False
    if link.startswith("https://t.me/pintopaybot?start=") or link.startswith("t.me/pintopaybot?start="):
        is_valid = True
    
    if not is_valid:
        # If link is invalid, we might still store it but we'll use fallback in generation
        # However, the user said "check the link all the time, it has to match"
        # So I will reject it if it doesn't match.
        raise HTTPException(
            status_code=400, 
            detail="Invalid referral link. Must start with 'https://t.me/pintopaybot?start=' or 't.me/pintopaybot?start='"
        )

    partner.personal_referral_link = link
    session.add(partner)
    await session.commit()
    
    return {"status": "success", "personal_referral_link": link}

@router.post("/generate", response_model=ViralGenerateResponse)
async def generate_content(
    payload: ViralGenerateRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    """
    Synthesize high-performing content using the Viral Marketing Studio.
    """
    # 1. Verification: Check if AI Engines are online
    capabilities = viral_studio.get_capabilities()
    if not capabilities["text_generation"]:
        # Attempt one-time emergency re-init for cloud environments (in case of startup racing)
        logger.warning("🚨 AI Engine reporting offline. Attempting emergency re-init...")
        viral_studio._init_clients()
        capabilities = viral_studio.get_capabilities()
        
    if not capabilities["text_generation"]:
        logger.error(f"❌ Elite Engines Offline for Partner {partner.id}")
        raise HTTPException(
            status_code=503,
            detail="The Elite AI synthesis engine is currently offline for maintenance. Please try again in 5 minutes."
        )

    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    # Check if a month has passed since last reset
    has_tokens = await viral_studio.check_tokens_and_reset(partner, session, min_tokens=2)
    if not has_tokens:
        raise HTTPException(status_code=402, detail="Insufficient tokens (2 tokens required: 1 for Text, 1 for Image)")
    
    # Deduct 2 tokens (1 for Text, 1 for Image)
    partner.pro_tokens -= 2
    session.add(partner)
    await session.commit()
    
    try:
        result = await viral_studio.generate_viral_content(
            partner=partner,
            post_type=payload.post_type,
            target_audience=payload.target_audience,
            language=payload.language,
            tone_of_voice=payload.tone_of_voice,
            referral_link=payload.referral_link,
            session=session
        )
    except Exception as e:
        logger.error(f"🚨 CRITICAL ERROR in Viral Generation for Partner {partner.id}: {e}")
        # Emergency Refund
        partner.pro_tokens += 2
        session.add(partner)
        await session.commit()
        raise HTTPException(
            status_code=500,
            detail=f"[STUDIO_CRASH] The synthesis engine encountered a critical internal error: {str(e)}"
        )
    
    if result.get("status") != "success":
        # Refund tokens on error
        partner.pro_tokens += 2
        session.add(partner)
        await session.commit()
        
        from app.core.errors import ViralStudioErrorCode
        error_code = result.get("error_code", ViralStudioErrorCode.GENERATION_FAILED)
        error_msg = result.get("error", "Generation failed. Please try again.")
        raise HTTPException(
            status_code=500, 
            detail=f"[{error_code}] {error_msg}"
        )
    
    return {
        "id": result.get("id"),
        "title": result["title"],
        "body": result["text"],
        "hashtags": result["hashtags"],
        "image_prompt": result["image_prompt"],
        "image_url": result.get("image_url"),
        "tokens_remaining": partner.pro_tokens
    }

@router.post("/generate-stream")
async def generate_content_stream(
    payload: ViralGenerateRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    """
    Synthesize content with real-time streaming (SSE).
    """
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    # 1. Token Check & Initial Deduction
    has_tokens = await viral_studio.check_tokens_and_reset(partner, session, min_tokens=2)
    if not has_tokens:
        raise HTTPException(status_code=402, detail="Insufficient tokens")
    
    partner.pro_tokens -= 2
    session.add(partner)
    await session.commit()

    async def event_generator():
        try:
            # Yield initial tokens remaining
            yield f"data: {json.dumps({'type': 'meta', 'tokens_remaining': partner.pro_tokens})}\n\n"
            
            async for event in viral_studio.generate_viral_content_stream(
                partner=partner,
                post_type=payload.post_type,
                target_audience=payload.target_audience,
                language=payload.language,
                tone_of_voice=payload.tone_of_voice,
                referral_link=payload.referral_link,
                session=session
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Stream Error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/regenerate-hashtags")
async def regenerate_hashtags(
    payload: ViralGenerateRequest,
    partner: Partner = Depends(get_current_partner)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    hashtags = await viral_studio.generate_hashtags(
        target_audience=payload.target_audience,
        post_type=payload.post_type,
        language=payload.language,
        tone=payload.tone_of_voice or "professional"
    )
    
    return {"hashtags": hashtags}

@router.post("/post")
async def publish_content(
    payload: SocialPostRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    result = await viral_studio.post_to_social(
        partner=partner,
        platform=payload.platform,
        content=payload.content,
        image_path=payload.image_path,
        generation_id=payload.generation_id,
        channel_id=payload.channel_id,  # ← PRO+ channel override
        session=session
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post("/test")
async def test_integration(
    payload: SocialPostRequest,
    partner: Partner = Depends(get_current_partner)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    test_content = (
        "🚀 **SYSTEM OVERRIDE: INITIATED** 🚀\n\n"
        "The connection to the **Pintopay Partner Club** is ACTIVE.\n\n"
        "We are not just building a network. We are architecting a **legacy**.\n\n"
        "The algorithm has been breached. The tools are in your hands.\n\n"
        "**It's time to dominate.**\n\n"
        "#PintopayPRO #FinancialRevolution #ViralMode"
    )
    
    result = await viral_studio.post_to_social(
        partner=partner,
        platform=payload.platform,
        content=test_content,
        image_path=None
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Return success with detailed results
    return {
        "status": "success", 
        "msg": result.get("msg", "Sync Verified! Viral Protocol Active."),
        "details": result.get("details", [])
    }

class HeadlineRequest(BaseModel):
    headline: str

class BioRequest(BaseModel):
    bio: str

class MarketingAuditRequest(BaseModel):
    force_refresh: bool = False
    language: str = "English"

@router.post("/tools/headline")
async def fix_headline_api(
    payload: HeadlineRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
        
    has_tokens = await viral_studio.check_tokens_and_reset(partner, session, min_tokens=1)
    if not has_tokens:
        raise HTTPException(status_code=402, detail="Insufficient tokens (1 required)")
    
    partner.pro_tokens -= 1
    session.add(partner)
    await session.commit()
    
    new_headline = await viral_studio.fix_headline(payload.headline)
    return {"result": new_headline, "tokens_remaining": partner.pro_tokens}

@router.post("/tools/trends")
async def get_trends_api(
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
        
    has_tokens = await viral_studio.check_tokens_and_reset(partner, session, min_tokens=3)
    if not has_tokens:
        raise HTTPException(status_code=402, detail="Insufficient tokens (3 required)")
    
    partner.pro_tokens -= 3
    session.add(partner)
    await session.commit()
    
    trends = await viral_studio.fetch_trends()
    return {"trends": trends, "tokens_remaining": partner.pro_tokens}

@router.post("/tools/bio")
async def generate_bio_api(
    payload: BioRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
        
    # Bio generation costs 2 tokens
    has_tokens = await viral_studio.check_tokens_and_reset(partner, session, min_tokens=2)
    if not has_tokens:
        raise HTTPException(status_code=402, detail="Insufficient tokens (2 required)")
    
    partner.pro_tokens -= 2
    session.add(partner)
    await session.commit()
    
    new_bio = await viral_studio.generate_bio(payload.bio)
    return {"bio": new_bio, "tokens_remaining": partner.pro_tokens}

@router.post("/tools/audit")
async def get_marketing_audit_api(
    payload: MarketingAuditRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
        
    # Audit logic: Viewing cached is free. Force refresh costs 3 tokens.
    audit_cost = 3 if payload.force_refresh else 0
    
    if audit_cost > 0:
        has_tokens = await viral_studio.check_tokens_and_reset(partner, session, min_tokens=audit_cost)
        if not has_tokens:
            raise HTTPException(status_code=402, detail=f"Insufficient tokens ({audit_cost} required)")
    
        partner.pro_tokens -= audit_cost
        session.add(partner)
        await session.commit()
    
    audit = await viral_studio.run_global_marketing_audit(
        language=payload.language,
        force_refresh=payload.force_refresh
    )
    return {"audit": audit, "tokens_remaining": partner.pro_tokens}

@router.get("/analytics/cabinet")
async def get_analytics_cabinet(
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    stats = await viral_analytics.get_partner_stats(partner.id, session)
    return stats

@router.get("/analytics/resonance")
async def get_predictive_resonance(
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    insights = await viral_analytics.get_predictive_insights(partner.id, session)
    return insights

@router.post("/analytics/post/{post_id}/refresh")
async def refresh_post_metrics(
    post_id: int,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    # Verify owner
    stmt = select(SocialPost).where(SocialPost.id == post_id, SocialPost.partner_id == partner.id)
    post = (await session.exec(stmt)).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    await viral_analytics.refresh_post_metrics(post_id, session)
    
    # Return updated stats
    stats = await viral_analytics.get_partner_stats(partner.id, session)
    return stats
