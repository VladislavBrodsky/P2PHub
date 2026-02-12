import asyncio
import time

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import get_session

# #comment: health checkpoints for Kubernetes/Railway probes.
# /health/ping is for liveness (fast), /health is for readiness (DB check).
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
    Also verifies Redis connectivity.
    """
    start_time = time.time()
    health_status = {
        "status": "healthy",
        "database": "unknown",
        "redis": "unknown",
        "latency_ms": 0
    }
    
    try:
        # Check Database
        async with asyncio.timeout(3.0):
            await session.exec(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = "disconnected"
        health_status["database_error"] = str(e)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        health_status["status"] = "unhealthy"

    try:
        # Check Redis
        from app.services.redis_service import redis_service
        async with asyncio.timeout(3.0):
            if await redis_service.client.ping():
                health_status["redis"] = "connected"
            else:
                 health_status["redis"] = "disconnected"
    except Exception as e:
        health_status["redis"] = "disconnected"
        health_status["redis_error"] = str(e)
        # Redis failure might be considered partial health or unhealthy depending on criticality
        # For now, let's mark it as unhealthy if Redis is down too
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        health_status["status"] = "unhealthy"

    latency = (time.time() - start_time) * 1000
    health_status["latency_ms"] = round(latency, 2)
    
    return health_status
