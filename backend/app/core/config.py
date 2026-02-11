from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

try:
    # Try common .env locations with error handling
    possible_env_paths = [
        Path(".env"),
        Path("backend/.env"),
        Path("../backend/.env"),
        Path("/app/.env"),
        Path("/app/backend/.env")
    ]

    loaded_env = False
    for p in possible_env_paths:
        try:
            if p.exists():
                load_dotenv(dotenv_path=p)
                print(f"✅ Loaded environment from {p.absolute()}")
                loaded_env = True
                break
        except Exception:
            continue

    if not loaded_env:
        # Fallback to default load_dotenv (current dir)
        load_dotenv()
except Exception as e:
    print(f"Warning: Unexpected error during .env loading: {e}")

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

    # AI Services
    OPENAI_API_KEY: Optional[str] = None

    # Payment settings
    ADMIN_TON_ADDRESS: str = "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN"
    ADMIN_USDT_ADDRESS: str = "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM"
    TON_API_KEY: Optional[str] = None
    TON_MANIFEST_URL: str = "https://p2phub-frontend.up.railway.app/tonconnect-manifest.json"
    PAYMENT_SERVICE_MODE: str = "ton_api" # Enum: auto_approve, ton_api, manual

    # Admin settings
    ADMIN_USER_IDS: list[str] = ["12345678", "537873096", "716720099"] # uslincoln added here



    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url:
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    class Config:
        # env_file = ".env"  <-- Removed to prevent PermissionError in sandbox
        # Allow extra fields from Railway/environment
        extra = "ignore"

settings = Settings()
