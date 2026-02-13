import logging
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user, get_tg_user
from app.models.partner import Partner, get_session
from app.services.support_service import support_service

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    status: str

class SessionStatusResponse(BaseModel):
    is_active: bool
    categories: List[str]

async def get_current_partner(
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
) -> Partner:
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))
    
    # #comment: Rapid Profile Caching (Redis) to avoid PostgreSQL bottlenecks
    # We cache the core partner object for 2 minutes during active support sessions.
    cache_key = f"partner_cache:{tg_id}"
    try:
        from app.services.redis_service import redis_service
        cached_partner = await redis_service.get_json(cache_key)
        if cached_partner:
            # Reconstruct model from dict (Fast Path)
            return Partner(**cached_partner)
    except Exception as e:
        logger.debug(f"Partner cache skip: {e}")

    # Fallback to DB (Slow Path)
    from sqlmodel import select
    stmt = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(stmt)
    partner = result.first()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Update cache for next turn
    try:
        await redis_service.set_json(cache_key, partner.dict(), expire=120)
    except:
        pass
        
    return partner

@router.get("/status", response_model=SessionStatusResponse)
async def get_support_status(partner: Partner = Depends(get_current_partner)):
    """Returns categorized entry points and session status."""
    from app.services.redis_service import redis_service
    session_key = f"support_session:{partner.telegram_id}"
    session_exists = await redis_service.get(session_key) is not None
    
    return {
        "is_active": session_exists,
        "categories": support_service.CATEGORIES
    }

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    payload: ChatRequest,
    partner: Partner = Depends(get_current_partner)
):
    """Entry point for chatting with AI agent."""
    try:
        # #comment: Extract rich user metadata for better logging
        user_metadata = {
            "username": partner.username,
            "first_name": partner.first_name,
            "last_name": partner.last_name,
            "language": partner.language_code,
            "level": partner.level,
            "balance": partner.balance
        }
        answer = await support_service.generate_response(partner.telegram_id, payload.message, user_metadata)
        return {"answer": answer, "status": "success"}
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return {"answer": "I'm sorry, I'm experiencing a temporary connection issue. Please try again in a moment.", "status": "error"}

@router.post("/close")
async def close_chat_session(partner: Partner = Depends(get_current_partner)):
    """Closes and saves the session."""
    await support_service.close_session(partner.telegram_id)
    return {"status": "closed"}

@router.post("/ping")
async def ping_session(partner: Partner = Depends(get_current_partner)):
    """Updates last activity to prevent auto-closure."""
    session = await support_service.get_session(partner.telegram_id)
    await support_service.update_session(partner.telegram_id, session)
    return {"status": "pinged"}
