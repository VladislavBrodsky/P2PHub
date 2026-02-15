from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"

    id: int | None = Field(default=None, primary_key=True)
    entity_type: str = Field(index=True)  # e.g., "partner", "transaction", "system"
    entity_id: str = Field(index=True)    # ID of the entity being audited
    action: str = Field(index=True)       # e.g., "create", "update", "delete", "upgrade_pro"
    actor_id: str | None = Field(default="system", index=True) # Who performed the action (user_id or "system")
    details: dict | None = Field(default=None, sa_column=Column(JSON)) # Flexible JSON payload
    ip_address: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    class Config:
        arbitrary_types_allowed = True
