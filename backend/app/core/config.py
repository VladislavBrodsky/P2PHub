from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

import time
start_time = time.time()

try:
    # Try common .env locations with error handling
    possible_env_paths = [
        Path(".env"),
        Path("backend/.env"),
        Path("backend/.env.backend"),
        Path("../backend/.env"),
        Path("/app/.env"),
        Path("/app/backend/.env")
    ]

    loaded_env = False
    for p in possible_env_paths:
        try:
            if p.exists():
                load_dotenv(dotenv_path=p)
                print(f"✅ Loaded environment from {p.absolute()} (took {time.time() - start_time:.4f}s)")
                loaded_env = True
                break
        except Exception:
            continue

    if not loaded_env:
        # Fallback to default load_dotenv (current dir)
        load_dotenv()
        print(f"ℹ️ Fallback to default .env loading (took {time.time() - start_time:.4f}s)")
except Exception as e:
    print(f"Warning: Unexpected error during .env loading: {e}")

settings_init_start = time.time()

class Settings(BaseSettings):
    # Required environment variables (with defaults for local development/migrations)
    BOT_TOKEN: str = ""
    DATABASE_URL: str
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
    # Why: API Key for OpenAI integration. Required for the ViralCopywriter service.
    # We attempt to load this from multiple .env locations (see possible_env_paths above)
    # due to varying permissions in different deployment/dev environments.
    OPENAI_API_KEY: Optional[str] = None

    # Monitoring & Error Tracking
    # #comment: Sentry DSN for production error tracking and monitoring.
    # Get this from https://sentry.io after creating a project.
    # Sentry automatically captures all exceptions and performance metrics.
    SENTRY_DSN: Optional[str] = None
    SENTRY_ENVIRONMENT: str = "production"  # Can be: production, staging, development
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1  # 10% of transactions for performance monitoring


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
print(f"⚙️ Settings initialized in {time.time() - settings_init_start:.4f}s")
