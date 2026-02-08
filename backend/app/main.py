from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import partner, earnings, tools
from bot import bot, dp

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start bot polling
    polling_task = asyncio.create_task(dp.start_polling(bot))
    yield
    # Shutdown
    await bot.session.close()
    polling_task.cancel()
    try:
        await polling_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Pintopay Partner Hub API", lifespan=lifespan)

# Configure CORS for TMA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(partner.router, prefix="/api/partner", tags=["partner"])
app.include_router(earnings.router, prefix="/api/earnings", tags=["earnings"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
