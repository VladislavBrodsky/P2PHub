from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.base import ShadowBaseModel


class InlineButton(ShadowBaseModel):
    """Pydantic model for Telegram inline buttons."""
    text: str
    url: str | None = None
    callback_data: str | None = None
    web_app: dict | None = None

class NotificationPayload(ShadowBaseModel):
    """
    Optimized Pydantic structure for Telegram notifications.
    Ensures type safety and faster serialization in TaskIQ.
    Inherits from ShadowBaseModel for robust audit compliance.
    chat_id is stored as str to prevent integer overflow for large Telegram IDs.
    """
    chat_id: str  # Always stored as str; coerced from int at creation time
    text: str
    parse_mode: str = "Markdown"
    buttons: list[list[InlineButton]] | None = None
    priority: str = "medium"  # low, medium, high (critical)
    salt: str = "" # Optional salt for deduplication (e.g. partner_id)

    @field_validator("chat_id", mode="before")
    @classmethod
    def coerce_chat_id(cls, v) -> str:
        return str(v)


