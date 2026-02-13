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
    
    from sqlmodel import select
    stmt = select(Partner).where(Partner.telegram_id == tg_id)
    result = await session.exec(stmt)
    partner = result.first()
    
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner

@router.get("/status", response_model=SessionStatusResponse)
async def get_support_status(partner: Partner = Depends(get_current_partner)):
    """Returns categorized entry points and session status."""
    return {
        "is_active": True,
        "categories": support_service.CATEGORIES
    }

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    payload: ChatRequest,
    partner: Partner = Depends(get_current_partner)
):
    """Entry point for chatting with AI agent."""
    answer = await support_service.generate_response(partner.telegram_id, payload.message)
    return {"answer": answer, "status": "success"}

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
