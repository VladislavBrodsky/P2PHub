from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import partner, earnings, tools
from app.core.config import settings
from bot import bot, dp
from aiogram import types

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    webhook_base = settings.WEBHOOK_URL
    
    if webhook_base and "your-backend-url" not in webhook_base:
        # Avoid double-appending the path
        path = settings.WEBHOOK_PATH
        webhook_url = webhook_base if webhook_base.endswith(path) else f"{webhook_base.rstrip('/')}{path}"
        
        try:
            await bot.set_webhook(
                url=webhook_url,
                secret_token=settings.WEBHOOK_SECRET,
                drop_pending_updates=True
            )
            print(f"🚀 Webhook set to: {webhook_url}")
        except Exception as e:
            print(f"❌ Failed to set webhook: {e}. Falling back to polling...")
            asyncio.create_task(dp.start_polling(bot))
    else:
        # Fallback to polling for local development or if URL is placeholder
        print("💡 WEBHOOK_URL is not set or is a placeholder. Starting Long Polling...")
        await bot.delete_webhook(drop_pending_updates=True)
        polling_task = asyncio.create_task(dp.start_polling(bot))
        app.state.polling_task = polling_task
        print("✅ Bot started with Long Polling")
    
    yield
    
    # Shutdown
    await bot.session.close()
    if not settings.WEBHOOK_URL and hasattr(app.state, "polling_task"):
        app.state.polling_task.cancel()
        try:
            await app.state.polling_task
        except asyncio.CancelledError:
            pass

app = FastAPI(title="Pintopay Partner Hub API", lifespan=lifespan)

# Webhook Endpoint
@app.post(settings.WEBHOOK_PATH)
async def bot_webhook(request: Request, x_telegram_bot_api_secret_token: str = Header(None)):
    if x_telegram_bot_api_secret_token != settings.WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret token")
    
    update = types.Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"status": "ok"}

# Configure CORS for TMA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(partner.router, prefix="/api/partner", tags=["partner"])
app.include_router(earnings.router, prefix="/api/earnings", tags=["earnings"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
from app.api.endpoints import health
app.include_router(health.router, tags=["health"])
