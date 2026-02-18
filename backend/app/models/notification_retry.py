
from datetime import datetime, UTC
from typing import Optional
from sqlmodel import SQLModel, Field, Column, JSON

class NotificationRetry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_id: int = Field(index=True)
    text: str
    parse_mode: Optional[str] = "Markdown"
    buttons: Optional[list] = Field(default=None, sa_column=Column(JSON))
    attempts: int = Field(default=0)
    last_error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    next_retry_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    status: str = Field(default="pending", index=True) # pending, failed, sent
