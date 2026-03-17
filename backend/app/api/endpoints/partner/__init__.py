from fastapi import APIRouter
from app.api.endpoints.partner.network import router as network_router
from app.api.endpoints.partner.profile import router as profile_router
from app.api.endpoints.partner.analytics import router as analytics_router
from app.api.endpoints.partner.tasks import router as tasks_router
from app.api.endpoints.partner.finance import router as finance_router

router = APIRouter()

router.include_router(network_router, tags=["Network"])
router.include_router(profile_router, tags=["Profile"])
router.include_router(analytics_router, tags=["Analytics"])
router.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
router.include_router(finance_router, tags=["Finance"])
