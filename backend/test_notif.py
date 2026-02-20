import asyncio
from pydantic import BaseModel
from typing import Optional, List

class InlineButton(BaseModel):
    text: str
    url: Optional[str] = None
    callback_data: Optional[str] = None
    web_app: Optional[dict] = None

class NotificationPayload(BaseModel):
    chat_id: int
    text: str
    parse_mode: str = "Markdown"
    buttons: Optional[List[List[InlineButton]]] = None
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
