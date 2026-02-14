import logging
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)
start_time = time.time()

try:
    # Try common .env locations with error handling
    possible_env_paths = [
        Path(".env"),
        Path("backend/.env"),
        Path("../../backend/.env"),
        Path("/app/.env"),
        Path("/app/backend/.env")
    ]

    loaded_env = False
    
    # Try find_dotenv first (very robust)
    from dotenv import find_dotenv
    try:
        found_env = find_dotenv()
        if found_env:
            load_dotenv(found_env, override=True)
            logger.info(f"✅ Loaded environment via find_dotenv: {found_env}")
            loaded_env = True
    except Exception as e:
        logger.warning(f"find_dotenv failed: {e}")

    for p in possible_env_paths:
        try:
            if p.exists():
                load_dotenv(dotenv_path=p, override=True)
                logger.info(f"✅ Loaded environment from {p.absolute()}")
                loaded_env = True
        except Exception as e:
            # #comment: Log debug info if an env file path fails to load, avoiding silent failure while continuing to try other paths.
            logger.debug(f"Failed to load env from {p}: {e}")
            continue
except Exception as e:
    logger.warning(f"Warning: Unexpected error during .env loading: {e}")

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
    PRO_PRICE_USD: float = 39.0

    # Admin settings
    ADMIN_USER_IDS: list[str] = ["12345678", "537873096", "716720099"] # uslincoln added here
    
    # --- System Constants (Business Logic) ---
    # Moved from services to core config to prevent desync
    
    # XP Distribution per level (1-9)
    # L1=35, L2=10, L3-9=1 (Fully restored as requested)
    REFERRAL_XP_MAP: dict[int, int] = {1: 35, 2: 10, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1}
    PRO_XP_MULTIPLIER: int = 5
    DAILY_CHECKIN_XP: int = 10
    STREAK_7DAY_XP_BONUS: int = 150

    # Commission Distribution for PRO Upgrades
    # Total: ~44% (30% L1, 5% L2, 3% L3, 1% L4-9)
    COMMISSION_MAP: dict[int, float] = {
        1: 0.30, 2: 0.05, 3: 0.03, 4: 0.01, 5: 0.01, 
        6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01
    }

    # Viral Marketing Categories (Synced with Frontend ProDashboard.tsx)
    VIRAL_POST_TYPES: list[str] = [
        "Product Launch", "FOMO Builder", "System Authority", 
        "Lifestyle Flex", "Passive Income Proof", "Network Growth", "Web3 Tutorial"
    ]
    
    VIRAL_AUDIENCES: list[str] = [
        "Cryptocurrency Traders", "Digital Nomads", "Affiliate Marketers", 
        "Network Builders", "Stay-at-home Parents", "Student Hustlers", "Corporate Burnouts"
    ]



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
logger.info(f"⚙️ Settings initialized in {time.time() - settings_init_start:.4f}s")
