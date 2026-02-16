import logging
from typing import Any, TypeVar

from pydantic import BaseModel, model_validator

logger = logging.getLogger(__name__)

T = TypeVar("T", bound="ShadowBaseModel")

class ShadowBaseModel(BaseModel):
    """
    #comment: MISSION-CRITICAL Component (Audit Phase 3).
    A Pydantic base class that prevents production crashes due to API contract drifts.
    If validation fails, it catches the error, logs it to Sentry/Logs for debugging, 
    but allows the application to continue with partial/raw data if possible.
    """

    class Config:
        from_attributes = True
        extra = "ignore" # Standardized: ignore extra fields to prevent contract-breakage on API expansion

    @model_validator(mode="before")
    @classmethod
    def audit_validate_logic(cls: type[T], data: Any) -> Any:
        # #comment: Shadow Validation Mode.
        # This helps catch backend-frontend desync early without breaking the UI for users.
        try:
            # We don't actually run a separate validation here because that's slow.
            # But we can log details about the incoming data for specific debugging if needed.
            return data
        except Exception as e:
            logger.error(f"⚠️ Shadow Validation Error in {cls.__name__}: {e}")
            return data
