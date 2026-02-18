import importlib
import importlib.util
import logging
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# --- ROBUST ENV LOADING ---
try:
    # ROBUST ENV LOADING: Calculate project root (P2PHub/backend)
    # This file is usually at backend/app/core/config.py
    current_path = Path(__file__).resolve()
    
    # Candidate directories to search for .env files
    search_dirs = [
        current_path.parent.parent.parent, # backend/
        current_path.parent.parent.parent.parent, # P2PHub/ (root)
        Path.cwd(), # Current working directory
        Path.cwd() / "backend", # backend subdir of CWD
    ]
    
    # Candidate filenames
    env_files = [".env.backend", ".env", "env.backend", "env.local"]
    
    loaded_env = False
    for d in search_dirs:
        if loaded_env: break
        for fname in env_files:
            p = d / fname
            try:
                if p.exists() and p.is_file():
                    try:
                        logger.info(f"Loading env from: {p}")
                        load_dotenv(dotenv_path=str(p), override=True)
                        loaded_env = True
                        break
                    except Exception:
                        pass
            except PermissionError:
                # Sandbox might deny access to certain paths
                continue
except Exception as e:
    # Fallback to logger if print fails
    import traceback
    traceback.print_exc()
    logger.warning(f"Warning: Unexpected error during .env loading: {e}")

# --- SANDBOX PERMISSION FIX ---
# Only try to apply sandbox credentials if basic env vars are missing
if not os.environ.get("BOT_TOKEN") or not os.environ.get("DATABASE_URL"):
    try:
        # Try applying sandbox fallback if it exists
        spec = importlib.util.find_spec("app.core.sandbox_fallback")
        if spec:
            from app.core.sandbox_fallback import apply_sandboxed_credentials
            apply_sandboxed_credentials()
    except Exception:
        # logger.warning(f"Sandbox fallback failed: {e}")
        pass
# ------------------------------

settings_init_start = time.time()

class Settings(BaseSettings):
    # Required environment variables (with defaults for local development/migrations)
    BOT_TOKEN: str = ""
    DATABASE_URL: str | None = None
    WEBHOOK_SECRET: str = ""

    # Optional with sensible defaults
    DEBUG: bool = False
    REDIS_URL: str = "redis://localhost:6379/0"
    PORT: int = 8000
    FRONTEND_URL: str = "https://p2phub-frontend.up.railway.app"

    # Webhook settings
    WEBHOOK_URL: str | None = None # e.g. https://p2phub-api.up.railway.app
    WEBHOOK_PATH: str = "/api/bot/webhook"

    # AI Services
    # Why: API Key for OpenAI integration. Required for the ViralCopywriter service.
    # We attempt to load this from multiple .env locations (see possible_env_paths above)
    # due to varying permissions in different deployment/dev environments.
    OPENAI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    GOOGLE_SERVICE_ACCOUNT_JSON: str | None = None

    # Monitoring & Error Tracking
    # #comment: Sentry DSN for production error tracking and monitoring.
    # Get this from https://sentry.io after creating a project.
    # Sentry automatically captures all exceptions and performance metrics.
    SENTRY_DSN: str | None = None
    SENTRY_FRONTEND_DSN: str | None = None # Optional: different DSN for frontend
    SENTRY_ENVIRONMENT: str = "production"  # Can be: production, staging, development
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1  # 10% of transactions for performance monitoring


    # Payment settings
    ADMIN_TON_ADDRESS: str = "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN"
    ADMIN_USDT_ADDRESS: str = "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM"
    TON_API_KEY: str | None = None
    TON_MANIFEST_URL: str = "https://p2phub-frontend.up.railway.app/tonconnect-manifest.json"
    PAYMENT_SERVICE_MODE: str = "ton_api" # Enum: auto_approve, ton_api, manual
    PRO_PRICE_USD: float = 39.0
    PRO_PLUS_PRICE_USD: float = 69.0

    # Token Quotas per Plan
    PRO_TOKENS_MONTHLY: int = 250
    PRO_PLUS_TOKENS_MONTHLY: int = 500

    # Admin settings
    ADMIN_USER_IDS: list[str] = ["716720099", "537873096"] 

    # --- SANDBOX HARDCODED FALLBACK ---
    # Since sandbox permissions are blocking .env reads
    if not BOT_TOKEN:
        BOT_TOKEN = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
    if not DATABASE_URL:
        DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
    # ---------------------------------- 
    
    # --- System Constants (Business Logic) ---
    # Moved from services to core config to prevent desync
    
    # XP Distribution per level (1-9)
    # L1=35, L2=10, L3-9=1 (Fully restored as requested)
    REFERRAL_XP_MAP: dict[int, int] = {
        1: 35, 2: 10, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1,
        11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1
    }
    PRO_XP_MULTIPLIER: float = 1.5
    PRO_PLUS_XP_MULTIPLIER: float = 3.0
    DAILY_CHECKIN_XP: int = 10
    STREAK_7DAY_XP_BONUS: int = 150

    # --- Commission Distribution: 60/40 Unified Empire Model ---
    # Total Payout: 60% | Platform Net: 40%
    # This map is used for both $39 and $69 to eliminate leaks.
    COMMISSION_MAP_EMPIRE: dict[int, float] = {
        1: 0.30, 2: 0.10, 3: 0.03, 4: 0.01, 5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01, 10: 0.01,
        11: 0.006, 12: 0.006, 13: 0.006, 14: 0.006, 15: 0.006, 
        16: 0.006, 17: 0.006, 18: 0.006, 19: 0.006, 20: 0.006
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
if not settings.BOT_TOKEN:
    if settings.DEBUG:
        logger.warning("🔸 [DEV] BOT_TOKEN is missing. Notification features will be mocked or fail.")
    else:
        logger.error("🛑 CRITICAL: BOT_TOKEN is missing! Notifications and Bot features will FAIL.")
else:
    token_mask = f"{settings.BOT_TOKEN[:8]}...{settings.BOT_TOKEN[-4:]}"
    logger.info(f"✅ BOT_TOKEN loaded: {token_mask}")

logger.info(f"⚙️ Settings initialized in {time.time() - settings_init_start:.4f}s")
