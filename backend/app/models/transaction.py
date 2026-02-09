from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime

class Transaction(SQLModel, table=True):
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
    partner: "Partner" = Relationship(back_populates="transactions")
