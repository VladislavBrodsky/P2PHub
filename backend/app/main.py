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


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.models.partner import create_db_and_tables
    from app.services.warmup_service import warmup_redis
    await create_db_and_tables()

    # Warmup re-enabled but limited to Top 1000 (see warmup_service.py)
    asyncio.create_task(warmup_redis())


    # Start the subscription expiration checker
    from app.services.subscription_service import subscription_service
    checker_task = asyncio.create_task(subscription_service.run_checker_task())
    app.state.subscription_checker = checker_task

    # Start the profile photo sync task (24h)
    async def run_photo_sync_task():
        from sqlalchemy.orm import sessionmaker
        from sqlmodel.ext.asyncio.session import AsyncSession

        from app.models.partner import engine
        from app.services.partner_service import sync_profile_photos

        while True:
            await asyncio.sleep(24 * 3600) # Run once every 24h
            try:
                print("📅 Triggering scheduled Profile Photo Sync...")
                async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
                async with async_session() as session:
                    await sync_profile_photos(bot, session)
            except Exception as e:
                print(f"❌ Photo Sync Task Error: {e}")

    photo_sync_task = asyncio.create_task(run_photo_sync_task())
    app.state.photo_sync = photo_sync_task

    print("✅ Background tasks started.")

    webhook_base = settings.WEBHOOK_URL

    if webhook_base and "your-backend-url" not in webhook_base:
        # Avoid double-appending the path
        path = settings.WEBHOOK_PATH
        webhook_url = webhook_base if webhook_base.endswith(path) else f"{webhook_base.rstrip('/')}{path}"

        try:
            # Small random jitters to prevent 4 workers from hitting Telegram API at the exact same millisecond
            import random
            await asyncio.sleep(random.uniform(0.1, 2.0))

            print(f"📡 Registering Webhook with Telegram: {webhook_url}")
            # Increased timeout to prevent startup hang on slow API responses
            async with asyncio.timeout(15.0):
                await bot.set_webhook(
                    url=webhook_url,
                    secret_token=settings.WEBHOOK_SECRET,
                    drop_pending_updates=True
                )
            print(f"🚀 Webhook successfully set to: {webhook_url}")
        except asyncio.TimeoutError:
            print("⚠️ Webhook registration timed out (15s). The app will continue starting...")
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
    try:
        from sqlalchemy import text

        from app.models.partner import engine
        print("🌍 Checking Database Connection (Timeout 5s)...")
        async with asyncio.timeout(5.0):
            async with engine.begin() as conn:
                print("   ⏳ Engine session begun, executing query...")
                await conn.execute(text("SELECT 1"))
        print("✅ Database Connection Successful")
    except asyncio.TimeoutError:
        print("⚠️ Database connection check timed out. Startup continues...")
    except Exception as e:
        print(f"❌ Database Connection Failed: {e}")
        print("⚠️ Application starting, but health checks may fail.")

    print("✅ Lifespan setup complete. App is live.")
    yield
    print("🛑 Shutting down Lifespan...")

    # Shutdown
    await bot.session.close()

    # Stop background tasks
    if hasattr(app.state, "subscription_checker"):
        app.state.subscription_checker.cancel()
        try:
            await app.state.subscription_checker
        except asyncio.CancelledError:
            pass

    if hasattr(app.state, "photo_sync"):
        app.state.photo_sync.cancel()
        try:
            await app.state.photo_sync
        except asyncio.CancelledError:
            pass

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
        print(f"⚠️ Webhook Secret Mismatch! Got: {x_telegram_bot_api_secret_token}, Expected: {settings.WEBHOOK_SECRET}")
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
    print(f"❌ Global Exception: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal Server Error"},
    )

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

# Serve promo images
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
images_dir = os.path.join(base_dir, "app_images")
if os.path.exists(images_dir):
    app.mount("/images", StaticFiles(directory=images_dir), name="images")
