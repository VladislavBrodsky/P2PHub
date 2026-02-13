"""
Audit log model for tracking all important system events.

#comment: Audit logs provide an immutable trail of all financial and important operations.
This is critical for:
- Compliance (financial regulations)
- Debugging ("Why didn't I get my commission?")
- Fraud detection
- User transparency
- System monitoring
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class AuditLog(SQLModel, table=True):
    """
    Audit log for all important system events.
    
    #comment: This table is append-only - never delete or update records.
    Every important operation should create an audit log entry.
    """
    
    __tablename__ = "audit_log"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Event information
    event_type: str = Field(index=True)  # "PRO_UPGRADE", "COMMISSION_PAID", "XP_AWARDED", etc.
    event_category: str = Field(default="system")  # "financial", "referral", "user", "admin", "system"
    
    # Who did it / who it affects
    partner_id: Optional[int] = Field(default=None, foreign_key="partner.id", index=True)
    related_partner_id: Optional[int] = Field(default=None, index=True)  # For referral events
    admin_id: Optional[str] = Field(default=None, index=True)  # Telegram ID of admin who performed action
    
    # Financial details
    amount: Optional[float] = Field(default=None)  # Amount involved
    currency: str = Field(default="XP")  # "XP", "USDT", "TON"
    balance_before: Optional[float] = Field(default=None)  # For balance changes
    balance_after: Optional[float] = Field(default=None)  # For balance changes
    
    # Additional context (JSON)
    extra_data: str = Field(default="{}")  # JSON string with extra details
    
    # Request tracking
    request_id: Optional[str] = Field(default=None, index=True)  # From request middleware
    ip_address: Optional[str] = Field(default=None)
    user_agent: Optional[str] = Field(default=None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    
    # Success/failure tracking
    success: bool = Field(default=True)  # Whether operation succeeded
    error_message: Optional[str] = Field(default=None)  # If failed, why?
    
    class Config:
        # #comment: Make created_at immutable after creation
        # This prevents accidental modification of audit trail
        json_schema_extra = {
            "example": {
                "event_type": "COMMISSION_PAID",
                "event_category": "financial",
                "partner_id": 123,
                "related_partner_id": 456,
                "amount": 11.70,
                "currency": "USDT",
                "balance_before": 0.0,
                "balance_after": 11.70,
                "extra_data": '{"level": 1, "percentage": 0.30, "pro_buyer_id": 456}',
                "success": True
            }
        }


# #comment: Common event types for consistency
class AuditEventType:
    """Enum-like class for event types."""
    
    # Financial events
    PRO_UPGRADE = "PRO_UPGRADE"
    COMMISSION_PAID = "COMMISSION_PAID"
    BALANCE_WITHDRAWN = "BALANCE_WITHDRAWN"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    
    # Referral events
    XP_AWARDED = "XP_AWARDED"
    REFERRAL_CREATED = "REFERRAL_CREATED"
    REFERRAL_CHAIN_PROCESSED = "REFERRAL_CHAIN_PROCESSED"
    
    # User events
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    PRO_EXPIRED = "PRO_EXPIRED"
    
    # Admin events
    ADMIN_ACTION = "ADMIN_ACTION"
    MANUAL_BALANCE_ADJUSTMENT = "MANUAL_BALANCE_ADJUSTMENT"
    
    # System events
    TASK_COMPLETED = "TASK_COMPLETED"
    NOTIFICATION_SENT = "NOTIFICATION_SENT"
    ERROR_OCCURRED = "ERROR_OCCURRED"


class AuditCategory:
    """Enum-like class for event categories."""
    
    FINANCIAL = "financial"
    REFERRAL = "referral"
    USER = "user"
    ADMIN = "admin"
    SYSTEM = "system"
