import asyncio
import json
import os
from contextlib import asynccontextmanager

from aiogram import types
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.endpoints import admin, earnings, leaderboard, partner, payment, tools
from app.core.config import settings
from bot import bot, dp

# #comment: Initialize Sentry for error tracking and performance monitoring.
# Only activates if SENTRY_DSN is set in environment variables.
# This automatically captures: exceptions, slow queries, HTTP requests, custom events.
# Get your DSN from https://sentry.io after creating a project.
if settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.asyncio import AsyncioIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    
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
        send_default_pii=False,  # Don't send user IPs/cookies for privacy
        attach_stacktrace=True,   # Include full stack traces
        before_send=lambda event, hint: event,  # Can filter events here if needed
    )
    print(f"✅ Sentry initialized (Environment: {settings.SENTRY_ENVIRONMENT}, Sample Rate: {settings.SENTRY_TRACES_SAMPLE_RATE})")
else:
    print("ℹ️  Sentry disabled (SENTRY_DSN not set)")



@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.models.partner import create_db_and_tables
    from app.services.warmup_service import warmup_redis
    
    # #comment: Always ensure DB tables exist. safe to run from multiple workers.
    await create_db_and_tables()

    # #comment: Warmup already has an internal Redis lock, so it's safe to call from all 4 workers.
    # Only one will succeed, the others will skip.
    asyncio.create_task(warmup_redis())
    
    # #comment: One-time restoration task for users affected by globalization script
    # This will run once on startup, protected by leader election
    async def restore_affected_users():
        try:
            from app.services.redis_service import redis_service
            lock_key = "lock:restore_users_from_telegram"
            # Check if already done
            done_key = "restore:users_completed_v2"
            if await redis_service.client.get(done_key):
                print("ℹ️ User restoration already completed. Skipping...")
                return
            
            is_leader = await redis_service.client.set(lock_key, "1", ex=300, nx=True)
            if is_leader:
                print("🔧 Leader Worker: Running user restoration from Telegram...")
                from scripts.restore_names_from_telegram import restore_names_from_telegram
                restored_count = await restore_names_from_telegram()
                
                # Clear all caches to force refresh
                print("🔧 Clearing all caches...")
                from scripts.clear_all_caches import clear_all_caches
                await clear_all_caches()
                
                # Mark as done so it doesn't run again
                await redis_service.client.set(done_key, "1", ex=86400 * 7)  # 7 days
                print(f"✅ User restoration complete: {restored_count} users restored")
            else:
                print("ℹ️ Another worker is handling user restoration. Skipping...")
        except Exception as e:
            print(f"⚠️ User restoration failed: {e}")
    
    asyncio.create_task(restore_affected_users())

    # #comment: Migrated Subscription and Photo Sync tasks to TaskIQ Scheduler.
    # We no longer run infinite loops here to save worker memory and prevent redundant DB load.



    print("✅ Webhook registration check starting...")

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
                print(f"📡 Leader Worker: Registering Webhook with Telegram: {webhook_url}")
                async with asyncio.timeout(15.0):
                    await bot.set_webhook(
                        url=webhook_url,
                        secret_token=settings.WEBHOOK_SECRET,
                        drop_pending_updates=True
                    )
                print(f"🚀 Webhook successfully set to: {webhook_url}")
            else:
                print("ℹ️ Webhook already registered by leader worker. Skipping...")
        except Exception as e:
            # Ignore flood control if it's already being handled by another worker
            if "Flood control exceeded" in str(e):
                print("⚠️ Webhook flood control: Another worker might have already set it. Continuing...")
            else:
                print(f"❌ Failed to set webhook (URL: {webhook_url}): {e}")
                import traceback
                traceback.print_exc()
    else:
        # Fallback to polling for local development or if URL is placeholder
        print("💡 WEBHOOK_URL is not set or is a placeholder. Starting Long Polling...")
        await bot.delete_webhook(drop_pending_updates=True)
        polling_task = asyncio.create_task(dp.start_polling(bot))
        app.state.polling_task = polling_task
        print("✅ Bot started with Long Polling")

    # Explicit Database Connection Check
    # Why: Catches database connection issues early in the startup process.
    # This prevents the app from starting with a broken database connection,
    # which would cause cryptic errors later during request handling.
    try:
        from sqlalchemy import text
        import asyncpg

        from app.models.partner import engine
        print("🌍 Checking Database Connection (Timeout 5s)...")
        async with asyncio.timeout(5.0):
            async with engine.begin() as conn:
                print("   ⏳ Engine session begun, executing query...")
                await conn.execute(text("SELECT 1"))
        print("✅ Database Connection Successful")
    except asyncpg.InvalidPasswordError as e:
        # Specific handling for authentication errors
        print("=" * 70, flush=True)
        print("❌ DATABASE AUTHENTICATION FAILED", flush=True)
        print("=" * 70, flush=True)
        print(f"Error: {e}", flush=True)
        print("\n📋 TROUBLESHOOTING STEPS:", flush=True)
        print("1. Go to Railway Dashboard → PostgreSQL service → Variables", flush=True)
        print("2. Copy the DATABASE_URL value", flush=True)
        print("3. Go to Backend service → Variables", flush=True)
        print("4. Update DATABASE_URL with the value from step 2", flush=True)
        print("5. Redeploy the backend service", flush=True)
        print("\n🔍 Common causes:", flush=True)
        print("   - Railway rotated the database password", flush=True)
        print("   - Manual password change not synced to backend", flush=True)
        print("   - Copied wrong DATABASE_URL from another service", flush=True)
        print("\n⚠️  Application CANNOT start with invalid database credentials!", flush=True)
        print("=" * 70, flush=True)
        # Exit with error code to prevent unhealthy deployment
        import sys
        sys.exit(1)
    except asyncio.TimeoutError:
        print("⚠️ Database connection check timed out. Startup continues...", flush=True)
        print("📋 This may indicate:", flush=True)
        print("   - Slow database startup", flush=True)
        print("   - Network connectivity issues", flush=True)
        print("   - Database under heavy load", flush=True)
    except Exception as e:
        print(f"❌ Database Connection Failed: {type(e).__name__}: {e}", flush=True)
        print("⚠️ Application starting, but health checks may fail.", flush=True)
        # Check if it's a connection-related error
        if "connection" in str(e).lower() or "refused" in str(e).lower():
            print("\n📋 Connection troubleshooting:", flush=True)
            print("   - Verify DATABASE_URL is correct", flush=True)
            print("   - Check if database service is running", flush=True)
            print("   - Ensure network connectivity", flush=True)

    print("✅ Lifespan setup complete. App is live.")
    yield
    print("🛑 Shutting down Lifespan...")

    # Shutdown
    await bot.session.close()

    if not settings.WEBHOOK_URL and hasattr(app.state, "polling_task"):
        app.state.polling_task.cancel()
        try:
            await app.state.polling_task
        except asyncio.CancelledError:
            pass

app = FastAPI(title="Pintopay Partner Hub API", lifespan=lifespan)

@app.get("/")
async def root_health():
    return {"status": "healthy", "service": "P2PHub Backend"}

# Webhook Endpoint
@app.post(settings.WEBHOOK_PATH)
async def bot_webhook(request: Request, x_telegram_bot_api_secret_token: str = Header(None)):
    if settings.DEBUG:
        print(f"📥 Received Webhook POST at {settings.WEBHOOK_PATH}")

    if x_telegram_bot_api_secret_token != settings.WEBHOOK_SECRET:
        print(f"⚠️ Webhook Secret Mismatch! (Token masked: {x_telegram_bot_api_secret_token[:4] if x_telegram_bot_api_secret_token else 'null'}...)")
        # Log headers for debugging (excluding sensitive info if possible)
        # print(f"Headers: {request.headers}")
        raise HTTPException(status_code=401, detail="Invalid secret token")

    try:
        body = await request.json()
        if settings.DEBUG:
            print(f"📦 Webhook Body: {json.dumps(body, indent=2)}")

        update = types.Update.model_validate(body, context={"bot": bot})
        
        # Log the update type and ID
        update_type = "unknown"
        if update.message: update_type = "message"
        elif update.callback_query: update_type = "callback_query"
        elif update.inline_query: update_type = "inline_query"
        
        print(f"🎭 Update {update.update_id} received (Type: {update_type})")

        # Feed the update to context-aware dispatcher
        await dp.feed_update(bot, update)
        
        if settings.DEBUG:
            print(f"✅ Update {update.update_id} processed successfully")

    except Exception as e:
        print(f"❌ Webhook Error: {e}")
        import traceback
        traceback.print_exc()
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
    print(f"❌ Global Exception [Request: {request_id}]: {exc}")
    import traceback
    traceback.print_exc()
    
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
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
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

app.include_router(partner.router, prefix="/api/partner", tags=["partner"])
app.include_router(earnings.router, prefix="/api/earnings", tags=["earnings"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
app.include_router(payment.router, prefix="/api/payment", tags=["payment"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
from app.api.endpoints import blog, config, health

app.include_router(blog.router, prefix="/api/blog", tags=["blog"])
app.include_router(health.router, tags=["health"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(config.router, prefix="/api/config", tags=["config"])

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
images_dir = os.path.join(base_dir, "app_images")
if os.path.exists(images_dir):
    app.mount("/images", CachedStaticFiles(directory=images_dir), name="images")
