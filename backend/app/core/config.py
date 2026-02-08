from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Required environment variables (no defaults for security)
    BOT_TOKEN: str
    DATABASE_URL: str
    
    # Optional with sensible defaults
    REDIS_URL: str = "redis://localhost:6379/0"
    PORT: int = 8000
    FRONTEND_URL: str = "https://p2phub-frontend.up.railway.app"
    
    class Config:
        env_file = ".env"
        # Allow extra fields from Railway/environment
        extra = "ignore"

settings = Settings()
