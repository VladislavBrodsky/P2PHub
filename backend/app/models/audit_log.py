from datetime import datetime
from typing import Optional, Any
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, JSON

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    entity_type: str = Field(index=True)  # e.g., "partner", "transaction", "system"
    entity_id: str = Field(index=True)    # ID of the entity being audited
    action: str = Field(index=True)       # e.g., "create", "update", "delete", "upgrade_pro"
    actor_id: Optional[str] = Field(default="system", index=True) # Who performed the action (user_id or "system")
    details: Optional[dict] = Field(default=None, sa_column=Column(JSON)) # Flexible JSON payload
    ip_address: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    class Config:
        arbitrary_types_allowed = True
