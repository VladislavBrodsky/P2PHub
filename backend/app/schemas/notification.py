from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


from app.schemas.base import ShadowBaseModel

class InlineButton(ShadowBaseModel):
    """Pydantic model for Telegram inline buttons."""
    text: str
    url: Optional[str] = None
    callback_data: Optional[str] = None
    web_app: Optional[dict] = None

class NotificationPayload(ShadowBaseModel):
    """
    Optimized Pydantic structure for Telegram notifications.
    Ensures type safety and faster serialization in TaskIQ.
    Inherits from ShadowBaseModel for robust audit compliance.
    """
    chat_id: int
    text: str
    parse_mode: str = "Markdown"
    buttons: Optional[List[List[InlineButton]]] = None
