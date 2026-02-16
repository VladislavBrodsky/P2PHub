from app.api.endpoints import partner
from fastapi import APIRouter

router = APIRouter()
router.include_router(partner.router, prefix="/partners", tags=["partners"])
