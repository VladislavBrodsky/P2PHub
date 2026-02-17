import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager

from aiogram import types
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

from app.api.endpoints import admin, earnings, leaderboard, partner, payment, pro, tools
from app.core.config import settings
from bot import bot, dp

# #comment: Initialize Sentry for error tracking and performance monitoring.
# Only activates if SENTRY_DSN is set in environment variables.
# This automatically captures: exceptions, slow queries, HTTP requests, custom events.
# Get your DSN from https://sentry.io after creating a project.
if settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.asyncio import AsyncioIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    
    # #comment: Add advanced filtering to keep Sentry clean of noise and PII
    def before_send(event, hint):
        # 1. Filter out health check spam (don't waste Sentry quota)
        if event.get('transaction') in ['/health', settings.WEBHOOK_PATH]:
            return None
            
        # 2. Scrub sensitive data from logs (Security best practice)
        if 'request' in event:
            headers = event['request'].get('headers', {})
            # Remove keys that might contain secrets
            for key in ['Authorization', 'X-Telegram-Bot-Api-Secret-Token', 'Cookie']:
                if key in headers: headers.pop(key)
        
        return event

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        integrations=[
            AsyncioIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
        ],
        # #comment: Send meaningful context with each error for easier debugging
        send_default_pii=True,  # User IP and headers are useful for debugging TWA
        attach_stacktrace=True,   # Include full stack traces
        before_send=before_send, 
        # #comment: Ignore common noise
        ignore_errors=[
            asyncio.CancelledError,
            HTTPException, # Expected 4xx errors
        ]
    )
    logger.info(f"✅ Sentry initialized (Environment: {settings.SENTRY_ENVIRONMENT}, Sample Rate: {settings.SENTRY_TRACES_SAMPLE_RATE})")
else:
    logger.info("ℹ️  Sentry disabled (SENTRY_DSN not set)")



@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.models.partner import create_db_and_tables
    from app.services.warmup_service import warmup_redis
    
    # #comment: Always ensure DB tables exist. safe to run from multiple workers.
    await create_db_and_tables()

    # #comment: Distributed Startup Tasks (Offloaded to Workers)
    # Using TaskIQ ensures these heavy operations don't block web worker startup
    # and are only executed by the worker cluster (with internal locking).
    from app.services.maintenance_service import migrate_blog_task, restore_names_task
    from app.services.support_service import warm_up_kb_task
    
    await warmup_redis.kiq()
    await warm_up_kb_task.kiq()
    await restore_names_task.kiq()
    await migrate_blog_task.kiq()

    # #comment: Migrated Subscription and Photo Sync tasks to TaskIQ Scheduler.
    # We no longer run infinite loops here to save worker memory and prevent redundant DB load.

    logger.info("✅ Webhook registration check starting...")

    webhook_base = settings.WEBHOOK_URL

    if webhook_base and "your-backend-url" not in webhook_base:
        # Avoid double-appending the path
        path = settings.WEBHOOK_PATH
        webhook_url = webhook_base if webhook_base.endswith(path) else f"{webhook_base.rstrip('/')}{path}"

        try:
            # #comment: Leader Election for Webhook. Only one worker should register the webhook.
            # This prevents 4 workers from hammering the Telegram API simultaneously.
            from app.services.redis_service import redis_service
            lock_key = "lock:webhook_registration"
            is_leader = await redis_service.client.set(lock_key, "1", ex=60, nx=True)

            if is_leader:
                logger.info(f"📡 Leader Worker: Registering Webhook with Telegram: {webhook_url}")
                async with asyncio.timeout(15.0):
                    await bot.set_webhook(
                        url=webhook_url,
                        secret_token=settings.WEBHOOK_SECRET,
                        drop_pending_updates=True
                    )
                logger.info(f"🚀 Webhook successfully set to: {webhook_url}")
            else:
                logger.info("ℹ️ Webhook already registered by leader worker. Skipping...")
        except Exception as e:
            # Ignore flood control if it's already being handled by another worker
            if "Flood control exceeded" in str(e):
                logger.warning("⚠️ Webhook flood control: Another worker might have already set it. Continuing...")
            else:
                logger.error(f"❌ Failed to set webhook (URL: {webhook_url}): {e}", exc_info=True)
    else:
        # Fallback to polling for local development or if URL is placeholder
        logger.info("💡 WEBHOOK_URL is not set or is a placeholder. Starting Long Polling...")
        await bot.delete_webhook(drop_pending_updates=True)
        polling_task = asyncio.create_task(dp.start_polling(bot))
        app.state.polling_task = polling_task
        logger.info("✅ Bot started with Long Polling")

    # Explicit Database Connection Check
    # Why: Catches database connection issues early in the startup process.
    # This prevents the app from starting with a broken database connection,
    # which would cause cryptic errors later during request handling.
    try:
        import asyncpg
        from sqlalchemy import text

        from app.models.partner import engine
        logger.info("🌍 Checking Database Connection (Timeout 5s)...")
        async with asyncio.timeout(5.0):
            async with engine.begin() as conn:
                logger.info("   ⏳ Engine session begun, executing query...")
                await conn.execute(text("SELECT 1"))
        logger.info("✅ Database Connection Successful")
    except asyncpg.InvalidPasswordError as e:
        # Specific handling for authentication errors
        logger.error("=" * 70)
        logger.error("❌ DATABASE AUTHENTICATION FAILED")
        logger.error("=" * 70)
        logger.error(f"Error: {e}")
        logger.error("\n📋 TROUBLESHOOTING STEPS:")
        logger.error("1. Go to Railway Dashboard → PostgreSQL service → Variables")
        logger.error("2. Copy the DATABASE_URL value")
        logger.error("3. Go to Backend service → Variables")
        logger.error("4. Update DATABASE_URL with the value from step 2")
        logger.error("5. Redeploy the backend service")
        logger.error("\n🔍 Common causes:")
        logger.error("   - Railway rotated the database password")
        logger.error("   - Manual password change not synced to backend")
        logger.error("   - Copied wrong DATABASE_URL from another service")
        logger.error("\n⚠️  Application CANNOT start with invalid database credentials!")
        logger.error("=" * 70)
        # Exit with error code to prevent unhealthy deployment
        import sys
        sys.exit(1)
    except asyncio.TimeoutError:
        logger.warning("⚠️ Database connection check timed out. Startup continues...")
        logger.info("📋 This may indicate:")
        logger.info("   - Slow database startup")
        logger.info("   - Network connectivity issues")
        logger.info("   - Database under heavy load")
    except Exception as e:
        logger.error(f"❌ Database Connection Failed: {type(e).__name__}: {e}")
        logger.warning("⚠️ Application starting, but health checks may fail.")
        # Check if it's a connection-related error
        if "connection" in str(e).lower() or "refused" in str(e).lower():
            logger.info("\n📋 Connection troubleshooting:")
            logger.info("   - Verify DATABASE_URL is correct")
            logger.info("   - Check if database service is running")
            logger.info("   - Ensure network connectivity")

    logger.info("✅ Lifespan setup complete. App is live.")
    yield
    logger.info("🛑 Shutting down Lifespan...")

    # Shutdown
    await bot.session.close()

    if not settings.WEBHOOK_URL and hasattr(app.state, "polling_task"):
        app.state.polling_task.cancel()
        try:
            await app.state.polling_task
        except asyncio.CancelledError:
            # #comment: Expected behavior when cancelling the polling task during shutdown.
            logger.info("ℹ️ Polling task cancelled successfully.")
        except Exception as e:
            logger.error(f"❌ Error cancelling polling task: {e}")


app = FastAPI(title="Pintopay Partner Hub API", lifespan=lifespan)

@app.get("/health")
async def health_check():
    """
    Rapid health check for system monitoring.
    Verify Redis connectivity and general availability.
    """
    try:
        from datetime import datetime

        from app.services.redis_service import redis_service
        is_redis_ok = await redis_service.client.ping()
        return {
            "status": "healthy",
            "redis": "online" if is_redis_ok else "offline",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"💥 Health check failed: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/")
async def root_health():
    return {"status": "healthy", "service": "P2PHub Backend"}

@app.get("/sentry-debug")
async def trigger_error():
    """Endpoint for testing Sentry integration."""
    division_by_zero = 1 / 0
    return {"result": division_by_zero}

# Webhook Endpoint
@app.post(settings.WEBHOOK_PATH)
async def bot_webhook(request: Request, x_telegram_bot_api_secret_token: str = Header(None)):
    if settings.DEBUG:
        logger.debug(f"📥 Received Webhook POST at {settings.WEBHOOK_PATH}")

    if x_telegram_bot_api_secret_token != settings.WEBHOOK_SECRET:
        logger.warning(f"⚠️ Webhook Secret Mismatch! (Token masked: {x_telegram_bot_api_secret_token[:4] if x_telegram_bot_api_secret_token else 'null'}...)")
        raise HTTPException(status_code=401, detail="Invalid secret token")

    try:
        body = await request.json()
        if settings.DEBUG:
            logger.debug(f"📦 Webhook Body: {json.dumps(body, indent=2)}")

        update = types.Update.model_validate(body, context={"bot": bot})
        
        # Log the update type and ID
        update_type = "unknown"
        if update.message: update_type = "message"
        elif update.callback_query: update_type = "callback_query"
        elif update.inline_query: update_type = "inline_query"
        
        logger.info(f"🎭 Update {update.update_id} received (Type: {update_type})")

        # Feed the update to context-aware dispatcher
        await dp.feed_update(bot, update)
        
        if settings.DEBUG:
            logger.debug(f"✅ Update {update.update_id} processed successfully")

    except Exception as e:
        logger.error(f"❌ Webhook Error: {e}", exc_info=True)
        # Return 200 anyway to prevent Telegram retry loops for code errors
        return {"status": "error", "message": str(e)}

    return {"status": "ok"}

# Import rate limiter
from slowapi.errors import RateLimitExceeded

from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler

# Add rate limiter state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"❌ Global Exception [Request: {request_id}]: {exc}", exc_info=True)
    
    # #comment: Send exception to Sentry if configured
    if settings.SENTRY_DSN:
        import sentry_sdk
        sentry_sdk.capture_exception(exc)
    
    return JSONResponse(
        status_code=500,
        content={
            "status": "error", 
            "message": "Internal Server Error",
            "request_id": request_id
        },
    )

# #comment: Request ID Middleware - Assigns unique ID to each request for tracing.
# This makes debugging SO much easier - you can grep logs for a specific request ID
# and see all operations that happened during that request across all services.
@app.middleware("http")
async def add_request_id_middleware(request: Request, call_next):
    import uuid

    import sentry_sdk
    
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # #comment: Synchronize request_id with Sentry for perfect searchability
    sentry_sdk.set_tag("request_id", request_id)
    
    # Add to response headers so clients can include it in bug reports
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response


# Configure CORS
allowed_origins = [
    "https://p2phub-frontend.up.railway.app",
    "https://p2phub-frontend-production.up.railway.app",
    "https://p2phub-production.up.railway.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add specific frontend URL from settings if not already there
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# #comment: Enable GZip compression for all responses > 500 bytes.
# This significantly reduces payload size for leaderboard, transaction history, etc.
app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(partner.router, prefix="/api/partner", tags=["partner"])
app.include_router(earnings.router, prefix="/api/earnings", tags=["earnings"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
app.include_router(payment.router, prefix="/api/payment", tags=["payment"])
app.include_router(pro.router, prefix="/api/pro", tags=["pro"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
from app.api.endpoints import blog, config, health

app.include_router(blog.router, prefix="/api/blog", tags=["blog"])
app.include_router(health.router, tags=["health"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(config.router, prefix="/api/config", tags=["config"])

from app.api.endpoints import support

app.include_router(support.router, prefix="/api/support", tags=["support"])

# #comment: Custom StaticFiles handler to inject aggressive Cache-Control headers.
# This ensures that images are cached by the browser/CDN for 1 year,
# which is perfect since our optimized WebP assets rarely change.
class CachedStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response

# Serve promo images
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Serve generated media (Fix for viral studio permissions)
generated_media_dir = os.path.join(base_dir, "generated_media")

# #comment: Defensively handle directory creation in Docker environments
# Railway containers may not have write permissions to /app during startup,
# or the directory might be owned by a different user (root vs app user).
# We catch the error and proceed - the viral_service.py has its own fallback to /tmp.
try:
    os.makedirs(generated_media_dir, exist_ok=True)
    logger.info(f"✅ Generated media directory ready: {generated_media_dir}")
    app.mount("/generated_media", CachedStaticFiles(directory=generated_media_dir), name="generated_media")
except (OSError, PermissionError) as e:
    logger.warning(f"⚠️ Cannot create {generated_media_dir} ({e}). Viral Studio will use /tmp fallback for image generation.")
    # Don't mount the directory if it doesn't exist - requests will gracefully 404

# Serve legacy promo images
images_dir = os.path.join(base_dir, "app_images")
if os.path.exists(images_dir):
    app.mount("/images", CachedStaticFiles(directory=images_dir), name="images")
