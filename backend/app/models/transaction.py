from datetime import datetime, UTC
from typing import TYPE_CHECKING

from sqlalchemy import Index
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.partner import Partner

class PartnerTransaction(SQLModel, table=True):
    __table_args__ = (
        Index("idx_tx_partner_status_created", "partner_id", "status", "created_at"),
        {"extend_existing": True}
    )
    id: int | None = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    amount: float
    amount_crypto: float | None = Field(default=None) # The exact crypto amount expected (fixed at session creation)
    currency: str = Field(index=True) # TON, USDT, BTC, etc.
    network: str # TON, TRC20, ERC20, etc.
    tx_hash: str | None = Field(default=None, index=True)
    status: str = Field(default="pending", index=True) # pending, completed, failed, manual_review
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_column_kwargs={"onupdate": lambda: datetime.now(UTC)})

    # Optional relationship back to Partner
    partner: "Partner" = Relationship(
        back_populates="transactions",
        sa_relationship_kwargs={"foreign_keys": "PartnerTransaction.partner_id"}
    )
