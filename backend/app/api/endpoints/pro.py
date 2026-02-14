import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from pydantic import BaseModel
from app.models.partner import Partner, get_session
from app.core.security import get_current_user, get_tg_user
from app.models.schemas import (
    PROSetupRequest, ViralGenerateRequest, ViralGenerateResponse, 
    SocialPostRequest, PartnerResponse
)
from app.services.viral_service import viral_studio

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
    
    return {
        "is_pro": partner.is_pro,
        "pro_tokens": partner.pro_tokens,
        "academy_score": partner.academy_score,
        "completed_stages": partner.completed_stages,
        "has_x_setup": bool(partner.x_api_key),
        "has_telegram_setup": bool(partner.telegram_channel_id),
        "has_linkedin_setup": bool(partner.linkedin_access_token),
        "setup": {
            "x_api_key": partner.x_api_key or "",
            "x_api_secret": partner.x_api_secret or "",
            "x_access_token": partner.x_access_token or "",
            "x_access_token_secret": partner.x_access_token_secret or "",
            "telegram_channel_id": partner.telegram_channel_id or "",
            "linkedin_access_token": partner.linkedin_access_token or ""
        },
        "capabilities": viral_studio.get_capabilities()
    }

@router.post("/academy/complete")
async def complete_academy_stage(
    stage_id: str,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
    import json
    completed = json.loads(partner.completed_stages)
    if stage_id not in completed:
        completed.append(stage_id)
        partner.completed_stages = json.dumps(completed)
        # Award 100 academy points per stage
        partner.academy_score += 100
        session.add(partner)
        await session.commit()
    
    return {"status": "success", "academy_score": partner.academy_score}

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
    if payload.telegram_channel_id: partner.telegram_channel_id = payload.telegram_channel_id
    if payload.linkedin_access_token: partner.linkedin_access_token = payload.linkedin_access_token
    
    session.add(partner)
    await session.commit()
    await session.refresh(partner)
    
    return {"status": "success"}

@router.post("/generate", response_model=ViralGenerateResponse)
async def generate_content(
    payload: ViralGenerateRequest,
    partner: Partner = Depends(get_current_partner),
    session: AsyncSession = Depends(get_session)
):
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
        referral_link=payload.referral_link,
        session=session
    )
    
    if result.get("status") == "failed":
        # Refund tokens on error
        partner.pro_tokens += 2
        session.add(partner)
        await session.commit()
        
        error_code = result.get("error_code", "V999")
        error_msg = result.get("error", "Unknown error")
        raise HTTPException(
            status_code=500, 
            detail=f"[{error_code}] {error_msg}"
        )
    
    return {
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
    partner: Partner = Depends(get_current_partner)
):
    if not partner.is_pro:
        raise HTTPException(status_code=403, detail="PRO membership required")
    
    result = await viral_studio.post_to_social(
        partner=partner,
        platform=payload.platform,
        content=payload.content,
        image_path=payload.image_path
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
    
    test_content = f"🚀 Pintopay Integration Test\n\nProtocol Status: ACTIVE\nTimestamp: {logger.name}"
    
    result = await viral_studio.post_to_social(
        partner=partner,
        platform=payload.platform,
        content=test_content,
        image_path=None
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

class HeadlineRequest(BaseModel):
    headline: str

class BioRequest(BaseModel):
    bio: str

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
