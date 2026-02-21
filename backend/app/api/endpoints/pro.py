import logging

from fastapi import APIRouter, Depends, HTTPException
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
)
from app.services.viral_analytics_service import viral_analytics
from app.services.viral_studio import viral_studio
from bot import bot

logger = logging.getLogger(__name__)

router = APIRouter()

async def get_current_partner(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Partner:
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))
    
    stmt = select(Partner).where(Partner.telegram_id == tg_id)
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
        "personal_referral_link": partner.personal_referral_link,
        "setup": {
            "x_api_key": partner.x_api_key or "",
            "x_api_secret": partner.x_api_secret or "",
            "x_access_token": partner.x_access_token or "",
            "x_access_token_secret": partner.x_access_token_secret or "",
            "telegram_channel_id": tg_main,
            "telegram_channels": tg_others,
            "linkedin_access_token": partner.linkedin_access_token or ""
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

# Academy Config: Cost (negative) or Reward (positive)
ACADEMY_RULES = {
    "m1": {"tokens": 1, "xp_reward": 500},
    "m2": {"tokens": 1, "xp_reward": 500},
    "m3": {"tokens": -1, "xp_cost": 20, "xp_reward": 2000},
    "m4": {"tokens": -2, "xp_cost": 500, "xp_reward": 5000},
    "m5": {"tokens": -3, "xp_cost": 2000, "xp_reward": 10000},
    "m6": {"tokens": -5, "xp_cost": 10000, "xp_reward": 50000},
}

@router.post("/academy/complete")
async def complete_academy_stage(
    stage_id: str,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    import json
    completed = json.loads(partner.completed_stages)
    
    if stage_id in completed:
        return {"status": "already_completed", "academy_score": partner.academy_score}

    rules = ACADEMY_RULES.get(stage_id, {"tokens": 0, "xp_reward": 100})
    token_change = rules["tokens"]
    xp_cost = rules.get("xp_cost", 0)
    xp_reward = rules.get("xp_reward", 100)

    # Check if user has enough tokens (if cost is involved)
    if token_change < 0 and partner.pro_tokens < abs(token_change):
         raise HTTPException(
            status_code=402, 
            detail=f"Insufficient tokens. This module requires {abs(token_change)} tokens."
        )
    
    # Check if user has enough XP (if cost is involved)
    if xp_cost > 0 and partner.academy_score < xp_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient Academy Score. This module requires {xp_cost} XP to unlock."
        )

    # Apply changes
    completed.append(stage_id)
    partner.completed_stages = json.dumps(completed)
    
    # Deduct XP cost before adding reward
    partner.academy_score -= xp_cost
    partner.academy_score += xp_reward
    partner.pro_tokens += token_change
    
    session.add(partner)
    await session.commit()
    
    return {
        "status": "success", 
        "academy_score": partner.academy_score, 
        "tokens_remaining": partner.pro_tokens,
        "token_change": token_change,
        "xp_reward": xp_reward,
        "xp_cost": xp_cost
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
    
    result = await viral_studio.generate_viral_content(
        partner=partner,
        post_type=payload.post_type,
        target_audience=payload.target_audience,
        language=payload.language,
        tone_of_voice=payload.tone_of_voice,
        referral_link=payload.referral_link,
        session=session
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
