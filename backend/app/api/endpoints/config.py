from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()

@router.get("/public")
async def get_public_config():
    """
    Returns non-sensitive configuration for the frontend.
    """
    return {
        "ton_manifest_url": settings.TON_MANIFEST_URL,
        "payment_mode": settings.PAYMENT_SERVICE_MODE,
        "admin_ton_address": settings.ADMIN_TON_ADDRESS,
        "admin_usdt_address": settings.ADMIN_USDT_ADDRESS,
        "is_debug": settings.DEBUG
    }
