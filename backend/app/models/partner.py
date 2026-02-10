from sqlmodel import SQLModel, Field, create_engine, Session, select, Relationship
from typing import Optional
from app.core.config import settings

from datetime import datetime

class Partner(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    telegram_id: str = Field(index=True, unique=True)
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    language_code: Optional[str] = Field(default="en") 
    balance: float = Field(default=0.0)
    xp: float = Field(default=0.0)
    level: int = Field(default=1)
    referral_code: str = Field(unique=True, index=True) # Optimized for lookups
    referrer_id: Optional[int] = Field(default=None, foreign_key="partner.id", index=True) # Optimized for joins
    path: Optional[str] = Field(default=None, index=True) # Materialized path (e.g. "1.5.23")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True) # Optimized for sorting
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow}, index=True)
    completed_tasks: str = Field(default="[]") # Store task IDs as JSON string
    
    # PRO Subscription Status
    is_pro: bool = Field(default=False, index=True)
    pro_expires_at: Optional[datetime] = Field(default=None)
    pro_purchased_at: Optional[datetime] = Field(default=None)
    pro_started_at: Optional[datetime] = Field(default=None)
    subscription_plan: Optional[str] = Field(default=None) # e.g. "PRO_LIFETIME", "PRO_YEARLY"
    
    # Materialized Totals (Optimized for 100K+ Users)
    total_earned_usdt: float = Field(default=0.0, index=True)
    referral_count: int = Field(default=0, index=True)
    
    # Verification & Payment Details
    last_transaction_id: Optional[int] = Field(default=None, foreign_key="partnertransaction.id")
    payment_details: Optional[str] = Field(default=None) # Store JSON of extra details if needed
    
    # Relationships
    referrals: list["Partner"] = Relationship(
        back_populates="referrer",
        sa_relationship_kwargs={"foreign_keys": "Partner.referrer_id"}
    )
    referrer: Optional["Partner"] = Relationship(
        back_populates="referrals",
        sa_relationship_kwargs={"remote_side": "Partner.id"}
    )
    completed_task_records: list["PartnerTask"] = Relationship(back_populates="partner")
    transactions: list["PartnerTransaction"] = Relationship(
        back_populates="partner",
        sa_relationship_kwargs={"foreign_keys": "PartnerTransaction.partner_id"}
    )
    xp_history: list["XPTransaction"] = Relationship(
        back_populates="partner",
        sa_relationship_kwargs={"foreign_keys": "XPTransaction.partner_id"}
    )
    last_transaction: Optional["PartnerTransaction"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Partner.last_transaction_id"}
    )

class XPTransaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    amount: float
    type: str = Field(index=True) # TASK, REFERRAL_L1, REFERRAL_DEEP, LEVEL_UP, BONUS
    description: Optional[str] = None
    reference_id: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    partner: Partner = Relationship(back_populates="xp_history")

class PartnerTask(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    task_id: str = Field(index=True)
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    reward_xp: float = Field(default=0.0)
    
    partner: Partner = Relationship(back_populates="completed_task_records")

class Earning(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True) # Optimized for user history
    amount: float
    description: str
    type: str = Field(default="COMMISSION", index=True) # COMMISSION, TASK_XP, REFERRAL_XP
    level: Optional[int] = None # 1-9
    currency: str = Field(default="USDT") # USDT, XP
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

# Fix for Railway providing postgresql:// or postgres:// but SQLAlchemy requiring postgresql+asyncpg://
database_url = settings.DATABASE_URL
if database_url:
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(database_url, echo=True, future=True)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
