from app.core.config import settings

def get_api_url() -> str:
    """Returns the base API URL for absolute link generation."""
    # Priority 1: Explicitly set WEBHOOK_URL (usually points to the API root in production)
    if settings.WEBHOOK_URL:
        # Strip /api/bot/webhook if it's there
        return settings.WEBHOOK_URL.split('/api')[0]
    
    # Priority 2: Return a default or empty string (relative paths will be used)
    return ""
