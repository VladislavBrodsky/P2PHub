import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# --- SETUP LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s",
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def find_backend_root() -> Path:
    """
    Robustly find the backend root directory.
    Searches upwards from this file until it finds a directory containing 'requirements.txt' or 'app/'.
    """
    current = Path(__file__).resolve().parent
    # Maximum 5 levels up to prevent escaping to system root
    for _ in range(5):
        try:
            if (current / "requirements.txt").exists() or (current / "app").exists():
                return current
        except PermissionError:
            pass
        if current.parent == current: # Reached system root
            break
        current = current.parent
    return Path.cwd() # Fallback to CWD

def find_and_load_env():
    """
    Search for .env files in a logical order.
    Priority: 
    1. Environment variables (already set)
    2. .env.backend (local override)
    3. .env (standard)
    4. env.backend / env.local (legacy)
    """
    backend_root = find_backend_root()
    
    # Potential directories to search
    search_dirs = [
        backend_root,
        backend_root.parent, # Project root
        Path.cwd()
    ]
    
    # Potential filenames
    env_filenames = ["p2p_config.env", ".env.backend", ".env", "env.backend", "env.local"]
    
    loaded_any = False
    for search_dir in search_dirs:
        for fname in env_filenames:
            env_path = search_dir / fname
            try:
                if env_path.exists() and env_path.is_file():
                    # Check readability
                    with open(env_path) as f:
                        content = f.read().strip()
                        if content:
                            load_dotenv(dotenv_path=str(env_path), override=False)
                            logger.info(f"✅ Loaded .env from: {env_path.resolve()}")
                            loaded_any = True
            except Exception as e:
                logger.debug(f"Skipping {env_path}: {e}")

    if not loaded_any:
        # Check raw environment
        db_url = os.environ.get("DATABASE_URL")
        redis_url = os.environ.get("REDIS_URL")
        logger.info(f"ℹ️ No .env files loaded. Raw ENV check: DATABASE_URL={'SET' if db_url else 'MISSING'}, REDIS_URL={'SET' if redis_url else 'MISSING'}")

# Execute environment loading
find_and_load_env()

class Settings(BaseSettings):
    # --- CORE SECRETS ---
    # We use validation_alias to ensure Pydantic sees the exact environment variable name
    BOT_TOKEN: str = Field(
        default="8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk", 
        validation_alias="BOT_TOKEN"
    )
    BOT_USERNAME: str = Field(default="pintopay_probot", validation_alias="BOT_USERNAME")
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway", 
        validation_alias="DATABASE_URL"
    )
    
    # --- OPTIONAL CONFIG ---
    DEBUG: bool = Field(default=False, validation_alias="DEBUG")
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    PORT: int = Field(default=8000, validation_alias="PORT")
    FRONTEND_URL: str = Field(default="https://p2phub-frontend-production.up.railway.app", validation_alias="FRONTEND_URL")
    
    # --- WEBHOOKS ---
    WEBHOOK_URL: str | None = Field(default=None, validation_alias="WEBHOOK_URL")
    WEBHOOK_PATH: str = "/api/bot/webhook"
    WEBHOOK_SECRET: str = Field(default="P2PHubSecret2026SecureToken", validation_alias="WEBHOOK_SECRET")

    # --- AI SERVICES ---
    OPENAI_API_KEY: str = Field(default="", validation_alias="OPENAI_API_KEY")
    GOOGLE_API_KEY: str = Field(default="", validation_alias="GOOGLE_API_KEY")
    GOOGLE_SERVICE_ACCOUNT_JSON: str = Field(default="{}", validation_alias="GOOGLE_SERVICE_ACCOUNT_JSON")
    TWITTER_BEARER_TOKEN: str = Field(default="", validation_alias="TWITTER_BEARER_TOKEN")

    # --- SENTRY ---
    SENTRY_DSN: str | None = Field(default=None, validation_alias="SENTRY_DSN")
    SENTRY_ENVIRONMENT: str = Field(default="production", validation_alias="SENTRY_ENVIRONMENT")
    SENTRY_TRACES_SAMPLE_RATE: float = Field(default=0.1, validation_alias="SENTRY_TRACES_SAMPLE_RATE")

    # --- BLOCKCHAIN & PAYMENTS ---
    ADMIN_TON_ADDRESS: str = "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN"
    ADMIN_USDT_ADDRESS: str = "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM"
    TON_API_KEY: str | None = Field(default=None, validation_alias="TON_API_KEY")
    TON_WEBHOOK_SECRET: str | None = Field(default=None, validation_alias="TON_WEBHOOK_SECRET")
    TON_MANIFEST_URL: str = Field(default="https://p2phub-frontend-production.up.railway.app/tonconnect-manifest.json", validation_alias="TON_MANIFEST_URL")

    # --- STRIPE PAYMENTS ---
    STRIPE_API_KEY: str | None = Field(default=None, validation_alias="STRIPE_API_KEY")
    STRIPE_WEBHOOK_SECRET: str | None = Field(default=None, validation_alias="STRIPE_WEBHOOK_SECRET")
    STRIPE_PRO_PRICE_ID: str | None = Field(default=None, validation_alias="STRIPE_PRO_PRICE_ID")
    STRIPE_PRO_PLUS_PRICE_ID: str | None = Field(default=None, validation_alias="STRIPE_PRO_PLUS_PRICE_ID")
    STRIPE_UPGRADE_PRICE_ID: str | None = Field(default=None, validation_alias="STRIPE_UPGRADE_PRICE_ID")


    # --- BUSINESS LOGIC ---
    PRO_PRICE_USD: float = 39.0
    PRO_PLUS_PRICE_USD: float = 69.0
    ADMIN_USER_IDS: list[str] = Field(default_factory=lambda: ["716720099", "537873096"], validation_alias="ADMIN_USER_IDS")

    # --- VIRAL STUDIO (PRO Features) ---
    PRO_TOKENS_MONTHLY: int = Field(default=250, validation_alias="PRO_TOKENS_MONTHLY")
    PRO_PLUS_TOKENS_MONTHLY: int = Field(default=500, validation_alias="PRO_PLUS_TOKENS_MONTHLY")
    
    VIRAL_POST_TYPES: list[str] = Field(
        default_factory=lambda: [
            "Strategic Launch", "Market Resonance", "Expert Leadership", 
            "Professional Lifestyle", "Financial Insights", "Community Scaling", "Web3 Intelligence"
        ],
        validation_alias="VIRAL_POST_TYPES"
    )
    VIRAL_AUDIENCES: list[str] = Field(
        default_factory=lambda: [
            "Crypto Professionals", "Digital Entrepreneurs", "Network Partners", 
            "Community Architects", "Family Investors", "Strategic Growth Tiers", "Career Professionals"
        ],
        validation_alias="VIRAL_AUDIENCES"
    )

    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "https://p2phub-frontend-production.up.railway.app",
            "http://localhost:3000",
            "http://localhost:5173",
        ],
        validation_alias="ALLOWED_ORIGINS"
    )

    # --- REWARDS & XP ---
    DAILY_CHECKIN_XP: float = 10.0
    STREAK_7DAY_XP_BONUS: float = 50.0
    REFERRAL_XP_MAP: dict[int, float] = Field(
        default_factory=lambda: {
            1: 100.0, 2: 50.0, 3: 30.0, 4: 20.0, 5: 15.0, 
            6: 10.0, 7: 8.0, 8: 6.0, 9: 5.0, 10: 4.0,
            11: 3.0, 12: 2.5, 13: 2.0, 14: 1.5, 15: 1.0,
            16: 0.8, 17: 0.6, 18: 0.4, 19: 0.2, 20: 0.1
        },
        validation_alias="REFERRAL_XP_MAP"
    )
    PRO_XP_MULTIPLIER: float = 1.5
    PRO_PLUS_XP_MULTIPLIER: float = 3.0
    FREE_REFERRAL_XP: float = 35.0  # Flat XP for Free users per qualified referral (L1-L3)
    
    PRO_UPGRADE_SELF_XP: float = 750.0   # XP for upgrading to PRO
    PRO_PLUS_UPGRADE_SELF_XP: float = 1250.0  # XP for upgrading to PRO+

    COMMISSION_MAP_GROWTH_STRATEGY: dict[int, float] = Field(
        default_factory=lambda: {
            # Free: L1-L3 | PRO: L4-L9 | PRO+: L10-L20
            1: 0.30, 2: 0.10, 3: 0.03,
            4: 0.01, 5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01, 10: 0.01,
            11: 0.006, 12: 0.006, 13: 0.006, 14: 0.006, 15: 0.006,
            16: 0.006, 17: 0.006, 18: 0.006, 19: 0.006, 20: 0.006
        },
        validation_alias="COMMISSION_MAP_GROWTH_STRATEGY"
    )

    # --- INFRASTRUCTURE ---
    SENTRY_FRONTEND_DSN: str | None = Field(default=None, validation_alias="SENTRY_FRONTEND_DSN")
    PAYMENT_SERVICE_MODE: str = Field(default="live", validation_alias="PAYMENT_SERVICE_MODE")

    # Helper property for asyncpg
    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if not url: return ""
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    # Pydantic v2 Config
    model_config = SettingsConfigDict(
        env_file=None, # Loaded manually to handle priority and naming
        extra="ignore",
        case_sensitive=True,
    )

    @model_validator(mode='before')
    @classmethod
    def empty_str_to_none(cls, data: Dict) -> Dict:
        """
        Convert empty strings or whitespace strings to None.
        This allows Pydantic to fall back to the defined 'default' values
        even if an empty variable is present in the environment.
        """
        if isinstance(data, dict):
            for key, value in data.items():
                if isinstance(value, str) and not value.strip():
                    data[key] = None
        return data

    @model_validator(mode='after')
    def audit_environment(self) -> 'Settings':
        """
        Final audit of the loaded configuration to prevent 'silent failure'.
        Checks if critical tokens are still using placeholders or are empty.
        """
        # 1. Check BOT_TOKEN
        if not self.BOT_TOKEN or len(self.BOT_TOKEN.strip()) < 10:
            logger.error("🛑 CRITICAL: BOT_TOKEN is empty or invalid! Telegram features will FAIL.")
        elif ":" not in self.BOT_TOKEN:
            logger.warning(f"⚠️ WARNING: BOT_TOKEN has unusual format: {self.BOT_TOKEN[:10]}...")
            
        # 2. Check DATABASE_URL
        if not self.DATABASE_URL or not any(x in self.DATABASE_URL for x in ["postgresql", "postgres", "sqlite"]):
            logger.error(f"🛑 CRITICAL: DATABASE_URL is invalid or missing! Type: {type(self.DATABASE_URL)}, Value: {str(self.DATABASE_URL)[:10] if self.DATABASE_URL else 'None'}...")
            
        # 3. Check REDIS_URL
        if not self.REDIS_URL or not any(self.REDIS_URL.startswith(s) for s in ["redis://", "rediss://", "unix://"]):
            logger.error(f"🛑 CRITICAL: REDIS_URL has invalid scheme! Value: {str(self.REDIS_URL)[:10] if self.REDIS_URL else 'None'}...")
            
        return self

# --- INSTANTIATE ---
settings_start = time.time()
try:
    settings = Settings()
    
    # Success Masking for logs
    if settings.BOT_TOKEN and ":" in settings.BOT_TOKEN:
        mask = f"{settings.BOT_TOKEN.split(':')[0]}...{settings.BOT_TOKEN[-4:]}"
        logger.info(f"✨ Settings loaded. Bot verified: {mask}")
        
    logger.info(f"⚙️ Configuration verified in {time.time() - settings_start:.4f}s")

except Exception as e:
    logger.error(f"🔥 FATAL: Configuration failed to initialize: {e}")
    # Print diagnostics for Railway logs
    print("--- CONFIG DIAGNOSTICS ---", file=sys.stderr)
    print(f"  CWD: {Path.cwd()}", file=sys.stderr)
    print(f"  Backend Root Found: {find_backend_root()}", file=sys.stderr)
    # Check if we can see the vars in the raw environment
    raw_token = os.environ.get("BOT_TOKEN")
    print(f"  Raw BOT_TOKEN in os.environ: {raw_token[:5] + '...' if raw_token else 'None'!r}", file=sys.stderr)
    sys.exit(1)
