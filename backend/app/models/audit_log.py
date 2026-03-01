from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import JSON, Column, text
from sqlmodel import Field, SQLModel


class ActionType(str, Enum):
    SYSTEM = "SYSTEM"
    UPGRADE = "UPGRADE"
    PAYMENT = "PAYMENT"
    COMMISSION = "COMMISSION"
    PENALTY = "PENALTY"
    MISC = "MISC"
    # Extended event types for full audit trail
    NOTIFICATION = "NOTIFICATION"   # Every notification send attempt
    XP_AWARD = "XP_AWARD"           # Every XP transaction
    REFERRAL = "REFERRAL"           # Every referral signup event
    RECONCILIATION = "RECONCILIATION" # Discrepancy flags from reconciler


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"

    id: int | None = Field(default=None, primary_key=True)
    partner_id: int | None = Field(default=None, foreign_key="partner.id", index=True) # Direct link for rapid querying
    
    # Keep legacy fields for backward compatibility, but prefer new architecture
    entity_type: str | None = Field(default=None, index=True)  
    entity_id: str | None = Field(default=None, index=True)    
    action: str | None = Field(default=None, index=True)       
    
    action_type: ActionType = Field(default=ActionType.MISC, index=True) # Core system action category
    description: str | None = Field(default=None) # Human-readable reason/description
    
    # #comment Performance Optimization (Scaling): 
    # Promoting these from JSON to top-level columns to fix external queries 
    # and improve indexing performance at 200K+ user scale.
    amount: float | None = Field(default=None, index=True)
    level: int | None = Field(default=None, index=True)

    actor_id: str | None = Field(default="system", index=True)
    details: dict | None = Field(default=None, sa_column=Column(JSON)) # Metadata (hashes, states)
    ip_address: str | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC).replace(tzinfo=None),
        index=True,
        sa_column_kwargs={"server_default": text("now()"), "nullable": False}
    )

    class Config:
        arbitrary_types_allowed = True

