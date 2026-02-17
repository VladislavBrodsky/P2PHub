from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field

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
    """
    chat_id: int
    text: str
    parse_mode: str = "Markdown"
    buttons: list[list[InlineButton]] | None = None
