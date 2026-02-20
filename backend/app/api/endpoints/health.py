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

@router.get("/payment-health", status_code=status.HTTP_200_OK)
async def payment_health_check(response: Response):
    """
    Specific health check for Payment Systems (TON API).
    Verifies connectivity to external price providers and blockchain nodes.
    """
    health = {
        "status": "healthy",
        "ton_api": "unknown",
        "latency_ms": 0
    }
    start = time.time()
    
    try:
        from app.services.payment_service import payment_service
        # Check TON Price API (connectivity test)
        async with asyncio.timeout(5.0):
            price = await payment_service.get_ton_price()
            if price > 0:
                health["ton_api"] = "connected"
                health["ton_price_usd"] = price
            else:
                health["ton_api"] = "error"
                health["status"] = "degraded"
                response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
                
    except Exception as e:
        health["ton_api"] = "disconnected"
        health["error"] = str(e)
        health["status"] = "unhealthy"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    health["latency_ms"] = round((time.time() - start) * 1000, 2)
    return health

@router.get("/notifications-health", status_code=status.HTTP_200_OK)
async def notifications_health_check(
    session: AsyncSession = Depends(get_session)
):
    """
    Exposes notification_retry status counts for real-time monitoring.
    """
    from sqlalchemy import func
    from sqlmodel import select

    from app.models.notification_retry import NotificationRetry
    
    # Check Database connection via NotificationRetry table
    try:
        # 1. Count items by status
        stmt = select(NotificationRetry.status, func.count(NotificationRetry.id)).group_by(NotificationRetry.status)
        result = await session.execute(stmt)
        # result is a sequence of (status, count)
        counts = {row[0]: row[1] for row in result.all()}
        
        # Add defaults for typical statuses
        for s in ["pending", "sent", "failed"]:
            if s not in counts:
                counts[s] = 0
                
        # 2. Check for stale pending items (stuck)
        from datetime import UTC, datetime, timedelta
        now = datetime.now(UTC).replace(tzinfo=None)
        ten_mins_ago = now - timedelta(minutes=10)
        
        stmt_stuck = select(func.count(NotificationRetry.id)).where(
            NotificationRetry.status == "pending",
            NotificationRetry.created_at <= ten_mins_ago
        )
        result_stuck = await session.execute(stmt_stuck)
        stuck_count = result_stuck.scalar() or 0
        
        # 3. Get latest error if any
        stmt_err = select(NotificationRetry.last_error).where(
            NotificationRetry.status != "sent",
            NotificationRetry.last_error.is_not(None)
        ).order_by(NotificationRetry.created_at.desc()).limit(1)
        res_err = await session.execute(stmt_err)
        last_error = res_err.scalar()

        return {
            "status": "healthy" if stuck_count < 10 else "congested",
            "counts": counts,
            "stuck_pending_10m": stuck_count,
            "last_error_sample": last_error,
            "server_time": now.isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
