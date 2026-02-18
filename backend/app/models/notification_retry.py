
from datetime import UTC, datetime
from typing import Optional

from sqlmodel import JSON, Column, Field, SQLModel


class NotificationRetry(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    chat_id: int = Field(index=True)
    text: str
    parse_mode: str | None = "Markdown"
    buttons: list | None = Field(default=None, sa_column=Column(JSON))
    attempts: int = Field(default=0)
    last_error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    next_retry_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    status: str = Field(default="pending", index=True) # pending, failed, sent
