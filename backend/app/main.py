import asyncio
import json
import logging
import os
import sys
import uuid
from contextlib import asynccontextmanager

from aiogram import types
from fastapi import FastAPI, Header, HTTPException, Request, Response
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
    
    # #comment: Migrations are handled by Alembic in start.sh.
    # We no longer call create_db_and_tables() here to prevent noisy "relation already exists"
    # errors in PostgreSQL logs during worker startup.

    # --- Distinguish between Web and Worker processes ---
    # TaskIQ workers should NOT handle bot updates (polling or webhooks).
    # We use multiple checks for robustness across different deployment environments.
    env_taskiq = str(os.environ.get("TASKIQ_WORKER", "")).lower() == "true"
    is_taskiq_worker = env_taskiq or any("taskiq" in arg.lower() for arg in sys.argv)
    
    service_name = os.environ.get("RAILWAY_SERVICE_NAME", "unknown").lower()
    # A service is 'web' if explicitly named so, or if it's NOT a background taskiq worker.
    is_web_service = ("web" in service_name or "backend" in service_name) and not is_taskiq_worker
    
    # Fallback: if we can't determine the service name, trust the TASKIQ_WORKER flag.
    if service_name == "unknown":
        is_web_service = not is_taskiq_worker
        
    logger.info(f"🔍 Process Discovery: Service='{service_name}', TaskIQ='{is_taskiq_worker}', IsWeb='{is_web_service}'")

    # #comment: Distributed Startup Tasks (Offloaded to Workers)
    # Using TaskIQ ensures these heavy operations don't block web worker startup.
    # We use a leader lock to ensure only ONE worker queues these tasks during deployment.
    from app.services.maintenance_service import migrate_blog_task, restore_names_task
    from app.services.redis_service import redis_service
    from app.services.support_service import warm_up_kb_task
    
    is_startup_leader = False
    try:
        startup_lock = "lock:startup_tasks_queued"
        # Only the first process of the first service to boot will queue tasks.
        is_startup_leader = await redis_service.client.set(startup_lock, "1", ex=300, nx=True)
    except Exception as e:
        logger.warning(f"⚠️ Could not check startup leader status (Redis issue): {e}")

    if is_startup_leader:
        try:
            logger.info("📡 Leader Process: Dispatching startup tasks to workers...")
            await warmup_redis.kiq()
            await warm_up_kb_task.kiq()
            await restore_names_task.kiq()
            await migrate_blog_task.kiq()
            logger.info("✅ Startup tasks successfully queued.")
        except Exception as e:
            logger.error(f"⚠️ Failed to queue startup tasks: {e}")
            logger.warning("Application will continue to boot, but background warmup might be delayed.")
    elif is_startup_leader is False:
        logger.debug("ℹ️ Startup tasks already dispatched by another leader process.")

    # --- Bot Integration Section (Web Only) ---
    if is_web_service:
        logger.info("✅ Bot integration check starting...")
        webhook_base = settings.WEBHOOK_URL

        if webhook_base and "your-backend-url" not in webhook_base:
            # Webhook Mode
            path = settings.WEBHOOK_PATH
            webhook_url = webhook_base if webhook_base.endswith(path) else f"{webhook_base.rstrip('/')}{path}"

            try:
                is_leader = await redis_service.client.set("lock:webhook_registration", "1", ex=60, nx=True)
                if is_leader:
                    logger.info(f"📡 Web Leader: Registering Webhook: {webhook_url}")
                    async with asyncio.timeout(15.0):
                        await bot.set_webhook(url=webhook_url, secret_token=settings.WEBHOOK_SECRET, drop_pending_updates=True)
                    logger.info("🚀 Webhook successfully set.")
            except Exception as e:
                logger.error(f"❌ Failed to set webhook: {e}")
        else:
            # Polling Mode
            try:
                # We need a long-lived lock for polling to prevent multiple web workers from polling at once.
                # However, we only attempt if we are the web service.
                is_polling_leader = await redis_service.client.set("lock:bot_polling_master", "1", ex=60, nx=True)
                
                if is_polling_leader:
                    logger.info("💡 Bot Polling Master: Starting Long Polling...")
                    await bot.delete_webhook(drop_pending_updates=True)
                    polling_task = asyncio.create_task(dp.start_polling(bot))
                    app.state.polling_task = polling_task
                    logger.info("✅ Bot started with Long Polling")
                else:
                    logger.info("ℹ️ Another web worker is already handling Bot Polling.")
            except Exception as e:
                logger.error(f"⚠️ Polling check failed: {e}")
    else:
        logger.info("ℹ️ TaskIQ Worker detected. Skipping bot integration (handled by web service).")

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
    
    from app.core.http_client import http_client
    await http_client.close_client()

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
    
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # #comment: Synchronize request_id with Sentry for perfect searchability (only when active)
    if settings.SENTRY_DSN:
        import sentry_sdk
        sentry_sdk.set_tag("request_id", request_id)
    
    # Add to response headers so clients can include it in bug reports
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response


# Configure CORS
allowed_origins = list(settings.ALLOWED_ORIGINS)

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
        # #comment: Explicitly allow CORS for assets to prevent canvas tainting and loading blocked by browser
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response

# Serve promo images
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Serve generated media (Fix for viral studio permissions)
generated_media_dir = os.path.join(base_dir, "generated_media")
import tempfile

tmp_media_dir = os.path.join(tempfile.gettempdir(), "p2phub_generated")
os.makedirs(tmp_media_dir, exist_ok=True)

# Try primary mount
try:
    os.makedirs(generated_media_dir, exist_ok=True)
    logger.info(f"✅ Generated media directory ready: {generated_media_dir}")
    app.mount("/generated_media", CachedStaticFiles(directory=generated_media_dir), name="generated_media")
except (OSError, PermissionError) as e:
    logger.warning(f"⚠️ Cannot use {generated_media_dir} ({e}). Falling back to {tmp_media_dir} for serving.")
    app.mount("/generated_media", CachedStaticFiles(directory=tmp_media_dir), name="generated_media")

# Serve legacy promo images
images_dir = os.path.join(base_dir, "app_images")
if os.path.exists(images_dir):
    app.mount("/images", CachedStaticFiles(directory=images_dir), name="images")
