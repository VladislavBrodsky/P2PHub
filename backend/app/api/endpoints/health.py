from fastapi import APIRouter, Depends, Response, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import text
from app.models.partner import get_session
import time

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(
    response: Response,
    session: AsyncSession = Depends(get_session)
):
    """
    Optimized health check for deployment.
    Verifies Database connectivity with a lightweight query.
    """
    start_time = time.time()
    try:
        # Fast query to check DB availability
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
        }
