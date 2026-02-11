from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.partner import Partner

class PartnerTransaction(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    amount: float
    currency: str # TON, USDT, BTC, etc.
    network: str # TON, TRC20, ERC20, etc.
    tx_hash: Optional[str] = Field(default=None, index=True)
    status: str = Field(default="pending") # pending, completed, failed, manual_review
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Optional relationship back to Partner
    partner: "Partner" = Relationship(
        back_populates="transactions",
        sa_relationship_kwargs={"foreign_keys": "PartnerTransaction.partner_id"}
    )
