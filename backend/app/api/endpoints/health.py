from fastapi import APIRouter, Depends, Response, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import text
from app.models.partner import get_session
import time

router = APIRouter()

@router.get("/health/ping", status_code=status.HTTP_200_OK)
async def health_ping():
    """
    Lightweight liveness probe.
    Returns 200 OK immediately if the container is running.
    Does NOT check database connectivity (use /health for that).
    """
    return {"status": "ok"}

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(
    response: Response,
    session: AsyncSession = Depends(get_session)
):
    """
    Readiness probe for deployment methods that need DB confirmation.
    Verifies Database connectivity with a strict 3-second timeout.
    """
    start_time = time.time()
    try:
        # Fast query to check DB availability with timeout
        # If DB is locked or slow (e.g. startup migration), this won't hang forever
        import asyncio
        async with asyncio.timeout(3.0):
            await session.exec(text("SELECT 1"))
            
        latency = (time.time() - start_time) * 1000
        return {
            "status": "healthy",
            "database": "connected",
            "latency_ms": round(latency, 2)
        }
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
