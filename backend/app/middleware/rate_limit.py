import redis.asyncio as redis
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings


# Initialize Redis-backed limiter for production, in-memory for local
def get_user_key(request: Request) -> str:
    """
    Returns the user's Telegram ID as the rate limit key if available,
    falling back to the remote IP address.
    """
    # 1. Try to get Telegram ID from header
    init_data = request.headers.get("X-Telegram-Init-Data")
    if init_data:
        try:
            import json
            from urllib.parse import parse_qsl
            vals = dict(parse_qsl(init_data))
            user_json = vals.get("user")
            if user_json:
                user_data = json.loads(user_json)
                tg_id = user_data.get("id")
                if tg_id:
                    return f"user:{tg_id}"
        except Exception:
            # #comment: Failed to parse Telegram Init Data, falling back to IP.
            # This is expected for standard HTTP requests or invalid headers.
            pass

    # 2. Fallback to IP address
    return get_remote_address(request)

# Initialize Redis-backed limiter for production, in-memory for local
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    limiter = Limiter(
        key_func=get_user_key,
        storage_uri=settings.REDIS_URL,
        default_limits=["100/minute"]  # Global rate limit
    )
except Exception as e:
    # #comment: Redis connection failed using configured settings.
    # Falling back to in-memory storage to keep the app running.
    import logging
    logging.getLogger(__name__).warning(f"⚠️ Redis Rate Limiter Init Failed: {e}")
    # Fallback to in-memory storage if Redis unavailable
    limiter = Limiter(
        key_func=get_user_key,
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
