import asyncio
from typing import List, Optional

from pydantic import BaseModel


class InlineButton(BaseModel):
    text: str
    url: str | None = None
    callback_data: str | None = None
    web_app: dict | None = None

class NotificationPayload(BaseModel):
    chat_id: int
    text: str
    parse_mode: str = "Markdown"
    buttons: list[list[InlineButton]] | None = None
    priority: str = "medium"

payload = NotificationPayload(
    chat_id=123,
    text="hello",
    buttons=[[
        {"text": "View Network", "web_app": {"url": "https://example.com"}},
        {"text": "Open App", "web_app": {"url": "https://example.com"}}
    ]]
)
print(payload.model_dump())
