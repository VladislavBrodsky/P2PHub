import logging
import os
import sys
import time
from pathlib import Path
from typing import Optional, List, Dict

from dotenv import load_dotenv
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# --- SETUP LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def find_backend_root() -> Path:
    """
    Robustly find the backend root directory.
    Searches upwards from this file until it finds a directory containing 'requirements.txt' or 'app/'.
    """
    current = Path(__file__).resolve().parent
    # Maximum 5 levels up to prevent escaping to system root
    for _ in range(5):
        if (current / "requirements.txt").exists() or (current / "app").exists():
            return current
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
    env_filenames = [".env.backend", ".env", "env.backend", "env.local"]
    
    loaded_any = False
    for search_dir in search_dirs:
        for fname in env_filenames:
            env_path = search_dir / fname
            try:
                if env_path.exists() and env_path.is_file():
                    # Check readability
                    with open(env_path, 'r') as f:
                        # Quick check for non-empty
                        if f.read(1):
                            load_dotenv(dotenv_path=str(env_path), override=False)
                            logger.info(f"✅ Environment variables loaded (if missing) from: {env_path.resolve()}")
                            loaded_any = True
                            # We keep loading in order of search_dirs (more specific overrides less specific)
                            # but usually we want to stop after the most specific one found.
                            return 
            except Exception as e:
                logger.debug(f"Skipping {env_path}: {e}")

    if not loaded_any:
        logger.info("ℹ️ No .env file loaded from standard locations. Relying on shell environment variables.")

# Execute environment loading
find_and_load_env()

class Settings(BaseSettings):
    # --- CORE SECRETS ---
    # We use validation_alias to ensure Pydantic sees the exact environment variable name
    BOT_TOKEN: str = Field(
        default="8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk", 
        validation_alias="BOT_TOKEN"
    )
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway", 
        validation_alias="DATABASE_URL"
    )
    
    # --- OPTIONAL CONFIG ---
    DEBUG: bool = Field(default=False, validation_alias="DEBUG")
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    PORT: int = Field(default=8000, validation_alias="PORT")
    FRONTEND_URL: str = Field(default="https://p2phub-frontend.up.railway.app", validation_alias="FRONTEND_URL")
    
    # --- WEBHOOKS ---
    WEBHOOK_URL: Optional[str] = Field(default=None, validation_alias="WEBHOOK_URL")
    WEBHOOK_PATH: str = "/api/bot/webhook"
    WEBHOOK_SECRET: str = Field(default="P2PHubSecret2026SecureToken", validation_alias="WEBHOOK_SECRET")

    # --- AI SERVICES ---
    OPENAI_API_KEY: str = Field(default="", validation_alias="OPENAI_API_KEY")
    GOOGLE_API_KEY: str = Field(default="", validation_alias="GOOGLE_API_KEY")
    GOOGLE_SERVICE_ACCOUNT_JSON: str = Field(default="{}", validation_alias="GOOGLE_SERVICE_ACCOUNT_JSON")

    # --- SENTRY ---
    SENTRY_DSN: Optional[str] = Field(default=None, validation_alias="SENTRY_DSN")
    SENTRY_ENVIRONMENT: str = Field(default="production", validation_alias="SENTRY_ENVIRONMENT")
    SENTRY_TRACES_SAMPLE_RATE: float = Field(default=0.1, validation_alias="SENTRY_TRACES_SAMPLE_RATE")

    # --- BLOCKCHAIN & PAYMENTS ---
    ADMIN_TON_ADDRESS: str = "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN"
    ADMIN_USDT_ADDRESS: str = "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM"
    TON_API_KEY: Optional[str] = Field(default=None, validation_alias="TON_API_KEY")
    TON_MANIFEST_URL: str = Field(default="https://p2phub-frontend.up.railway.app/tonconnect-manifest.json", validation_alias="TON_MANIFEST_URL")

    # --- BUSINESS LOGIC ---
    PRO_PRICE_USD: float = 39.0
    PRO_PLUS_PRICE_USD: float = 69.0
    ADMIN_USER_IDS: List[str] = Field(default_factory=lambda: ["716720099", "537873096"], validation_alias="ADMIN_USER_IDS")

    # --- VIRAL STUDIO (PRO Features) ---
    PRO_TOKENS_MONTHLY: int = Field(default=250, validation_alias="PRO_TOKENS_MONTHLY")
    PRO_PLUS_TOKENS_MONTHLY: int = Field(default=500, validation_alias="PRO_PLUS_TOKENS_MONTHLY")
    
    VIRAL_POST_TYPES: List[str] = Field(
        default_factory=lambda: [
            "Product Launch", "FOMO Builder", "System Authority", 
            "Lifestyle Flex", "Passive Income Proof", "Network Growth", "Web3 Tutorial"
        ],
        validation_alias="VIRAL_POST_TYPES"
    )
    VIRAL_AUDIENCES: List[str] = Field(
        default_factory=lambda: [
            "Cryptocurrency Traders", "Digital Nomads", "Affiliate Marketers", 
            "Network Builders", "Stay-at-home Parents", "Student Hustlers", "Corporate Burnouts"
        ],
        validation_alias="VIRAL_AUDIENCES"
    )

    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "https://p2phub-frontend.up.railway.app",
            "http://localhost:3000",
            "http://localhost:5173",
        ],
        validation_alias="ALLOWED_ORIGINS"
    )

    # --- REWARDS & XP ---
    DAILY_CHECKIN_XP: float = 10.0
    STREAK_7DAY_XP_BONUS: float = 50.0
    REFERRAL_XP_MAP: Dict[int, float] = Field(
        default_factory=lambda: {
            1: 100.0, 2: 50.0, 3: 30.0, 4: 20.0, 5: 15.0, 
            6: 10.0, 7: 8.0, 8: 6.0, 9: 5.0, 10: 4.0,
            11: 3.0, 12: 2.5, 13: 2.0, 14: 1.5, 15: 1.0,
            16: 0.8, 17: 0.6, 18: 0.4, 19: 0.2, 20: 0.1
        },
        validation_alias="REFERRAL_XP_MAP"
    )
    PRO_XP_MULTIPLIER: float = 2.0
    PRO_PLUS_XP_MULTIPLIER: float = 3.0

    COMMISSION_MAP_EMPIRE: Dict[int, float] = Field(
        default_factory=lambda: {
            # Free: L1-L3 | PRO: L4-L9 | PRO+: L10-L20
            1: 0.30, 2: 0.10, 3: 0.03,
            4: 0.01, 5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01, 10: 0.01,
            11: 0.006, 12: 0.006, 13: 0.006, 14: 0.006, 15: 0.006,
            16: 0.006, 17: 0.006, 18: 0.006, 19: 0.006, 20: 0.006
        },
        validation_alias="COMMISSION_MAP_EMPIRE"
    )

    # --- INFRASTRUCTURE ---
    SENTRY_FRONTEND_DSN: Optional[str] = Field(default=None, validation_alias="SENTRY_FRONTEND_DSN")
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
        if not self.DATABASE_URL or "postgresql" not in self.DATABASE_URL:
            logger.error("🛑 CRITICAL: DATABASE_URL is missing or not a Postgres URL!")
            
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
    print(f"--- CONFIG DIAGNOSTICS ---", file=sys.stderr)
    print(f"  CWD: {Path.cwd()}", file=sys.stderr)
    print(f"  Backend Root Found: {find_backend_root()}", file=sys.stderr)
    # Check if we can see the vars in the raw environment
    raw_token = os.environ.get("BOT_TOKEN")
    print(f"  Raw BOT_TOKEN in os.environ: {repr(raw_token[:5] + '...' if raw_token else 'None')}", file=sys.stderr)
    sys.exit(1)
