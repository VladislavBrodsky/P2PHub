from datetime import UTC, datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Column
from sqlalchemy import Enum as SaEnum
from sqlmodel import Field, SQLModel


class BroadcastStatus(str, Enum):
    PENDING = "pending"
    SENDING = "sending"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    FAILED = "failed"

class AudienceFilter(str, Enum):
    ALL = "all"
    PRO_ONLY = "pro_only"
    FREE_ONLY = "free_only"
    LEVEL_1 = "level_1"
    INACTIVE_7D = "inactive_7d"

class Broadcast(SQLModel, table=True):
    __tablename__ = "broadcast"

    id: int | None = Field(default=None, primary_key=True)
    admin_id: str = Field(index=True)
    message_text: str
    audience_type: AudienceFilter = Field(
        sa_column=Column(SaEnum(AudienceFilter, native_enum=False), default=AudienceFilter.ALL)
    )
    
    status: BroadcastStatus = Field(
        sa_column=Column(SaEnum(BroadcastStatus, native_enum=False), default=BroadcastStatus.PENDING, index=True)
    )
    
    total_targets: int = Field(default=0)
    sent_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    last_partner_id: int | None = Field(default=0, description="Resume cursor for chunked broadacsts")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))


    class Config:
        arbitrary_types_allowed = True
