from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from app.core.config import settings
import redis.asyncio as redis

# Initialize Redis-backed limiter for production, in-memory for local
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=settings.REDIS_URL,
        default_limits=["100/minute"]  # Global rate limit
    )
except Exception:
    # Fallback to in-memory storage if Redis unavailable
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["100/minute"]
    )

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Custom error response for rate limit violations"""
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": f"Too many requests. Please wait {exc.retry_after} seconds.",
            "retry_after": exc.retry_after
        },
        headers={"Retry-After": str(exc.retry_after)}
    )
