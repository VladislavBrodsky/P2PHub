from fastapi import APIRouter
from app.api.endpoints import partner

router = APIRouter()
router.include_router(partner.router, prefix="/partners", tags=["partners"])
