from fastapi import APIRouter
from .network import router as network_router
from .profile import router as profile_router
from .analytics import router as analytics_router
from .tasks import router as tasks_router
from .finance import router as finance_router

router = APIRouter()

router.include_router(network_router, tags=["Network"])
router.include_router(profile_router, tags=["Profile"])
router.include_router(analytics_router, tags=["Analytics"])
router.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
router.include_router(finance_router, tags=["Finance"])
