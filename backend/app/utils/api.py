from app.core.config import settings


def get_api_url() -> str:
    """Returns the base API URL for absolute link generation."""
    # Priority 1: Explicitly set WEBHOOK_URL
    if settings.WEBHOOK_URL:
        if '/api' in settings.WEBHOOK_URL:
            return settings.WEBHOOK_URL.split('/api')[0]
        return settings.WEBHOOK_URL.rstrip('/')
    
    # Priority 2: Production fallback
    return "https://p2phub-production.up.railway.app"
