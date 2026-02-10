from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv

from pathlib import Path
try:
    env_path = Path(".env")
    if not env_path.exists():
        env_path = Path("backend/.env")
    if not env_path.exists():
        # If we are inside backend/ already
        pass
    load_dotenv(dotenv_path=env_path if env_path.exists() else None)
except Exception as e:
    print(f"Warning: Could not load .env file due to {e}")
    load_dotenv()

class Settings(BaseSettings):
    # Required environment variables (with defaults for local development/migrations)
    BOT_TOKEN: str = ""
    DATABASE_URL: str = "sqlite+aiosqlite:///dev.db"
    WEBHOOK_SECRET: str = ""
    
    # Optional with sensible defaults
    DEBUG: bool = False
    REDIS_URL: str = "redis://localhost:6379/0"
    PORT: int = 8000
    FRONTEND_URL: str = "https://p2phub-frontend.up.railway.app"
    
    # Webhook settings
    WEBHOOK_URL: Optional[str] = None # e.g. https://p2phub-api.up.railway.app
    WEBHOOK_PATH: str = "/api/bot/webhook"
    
    # Payment settings
    ADMIN_TON_ADDRESS: str = "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN"
    ADMIN_USDT_ADDRESS: str = "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM"
    TON_API_KEY: Optional[str] = None
    TON_MANIFEST_URL: str = "https://p2phub-frontend.up.railway.app/tonconnect-manifest.json"
    PAYMENT_SERVICE_MODE: str = "ton_api" # Enum: auto_approve, ton_api, manual
    
    # Admin settings
    ADMIN_USER_IDS: list[str] = ["12345678", "537873096", "716720099"] # uslincoln added here


    
    class Config:
        # env_file = ".env"  <-- Removed to prevent PermissionError in sandbox
        # Allow extra fields from Railway/environment
        extra = "ignore"

settings = Settings()
