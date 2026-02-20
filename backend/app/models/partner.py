from datetime import UTC, datetime, timedelta
from typing import Optional

from sqlalchemy import Index, UniqueConstraint, text
from sqlmodel import Field, Relationship, SQLModel

from app.core.config import settings


class Partner(SQLModel, table=True):
    __table_args__ = (
        Index("idx_partner_referrer_created", "referrer_id", "created_at"),
        Index(
            "idx_partner_ispro_expires", 
            "is_pro", 
            "pro_expires_at", 
            postgresql_where=text("is_pro = true")
        ),
        # #comment Phase 2: Optimized for batch notifications and leaderboard slicing
        Index("idx_partner_pro_notif", "is_pro", "notifications_paused"),
        Index("idx_partner_level_xp", "level", "xp"),
        {"extend_existing": True}
    )
    id: int | None = Field(default=None, primary_key=True)
    telegram_id: str = Field(index=True, unique=True)
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None
    photo_file_id: str | None = None  # Telegram file_id for profile photo
    language_code: str | None = Field(default="en")
    balance: float = Field(default=0.0)
    xp: float = Field(default=0.0, index=True)
    level: int = Field(default=1)
    referral_code: str = Field(unique=True, index=True) # Optimized for lookups
    referrer_id: int | None = Field(default=None, foreign_key="partner.id", index=True) # Optimized for joins
    path: str | None = Field(default=None, index=True) # Materialized path (e.g. "1.5.23")
    depth: int = Field(default=0, index=True) # Cached depth level for faster hierarchy queries
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), index=True) # Optimized for sorting
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), sa_column_kwargs={"onupdate": lambda: datetime.now(UTC).replace(tzinfo=None)}, index=True)
    completed_stages: str = Field(default="[]") # Store Academy stage IDs as JSON string
    academy_score: float = Field(default=0.0) # Track Academy points

    # PRO Subscription Status
    is_pro: bool = Field(default=False, index=True)
    pro_expires_at: datetime | None = Field(default=None)
    pro_purchased_at: datetime | None = Field(default=None)
    pro_started_at: datetime | None = Field(default=None)
    pro_notification_seen: bool = Field(default=False)  # Track if user saw the "You are PRO" card
    subscription_plan: str | None = Field(default=None) # e.g. "PRO_LIFETIME", "PRO_YEARLY", "PRO_PLUS_MONTHLY"
    notifications_paused: bool = Field(default=False, index=True) # Set to true if user blocks bot or opts out
    
    @property
    def is_pro_plus(self) -> bool:
        return self.subscription_plan == "PRO_PLUS_MONTHLY"
    
    # PRO Content Generation Tokens
    pro_tokens: int = Field(default=500)
    pro_tokens_last_reset: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))

    # Viral Marketing API Setup
    x_api_key: str | None = Field(default=None)
    x_api_secret: str | None = Field(default=None)
    x_access_token: str | None = Field(default=None)
    x_access_token_secret: str | None = Field(default=None)
    telegram_channel_id: str | None = Field(default=None)
    linkedin_access_token: str | None = Field(default=None)
    personal_referral_link: str | None = Field(default=None)

    # Daily Check-in Tracking
    last_checkin_at: datetime | None = Field(default=None, index=True)
    checkin_streak: int = Field(default=0, index=True)

    # Materialized Totals (Optimized for 100K+ Users)
    total_earned_usdt: float = Field(default=0.0, index=True)
    referral_count: int = Field(default=0, index=True)

    # Verification & Payment Details
    last_transaction_id: int | None = Field(default=None, foreign_key="partnertransaction.id")
    payment_details: str | None = Field(default=None) # Store JSON of extra details if needed

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
    __table_args__ = (
        UniqueConstraint("partner_id", "type", "reference_id", name="uq_partner_xp_ref"),
        Index("idx_xp_partner_created", "partner_id", "created_at"),
        {"extend_existing": True}
    )
    id: int | None = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    amount: float
    type: str = Field(index=True) # TASK, REFERRAL_L1, REFERRAL_DEEP, LEVEL_UP, BONUS
    description: str | None = None
    reference_id: str | None = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), index=True)

    partner: Partner = Relationship(back_populates="xp_history")

class PartnerTask(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("partner_id", "task_id", name="uq_partner_task"),
        {"extend_existing": True}
    )
    id: int | None = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    task_id: str = Field(index=True)
    status: str = Field(default="COMPLETED") # STARTED, COMPLETED
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), index=True)
    initial_metric_value: int = Field(default=0) # Snapshot of metric at start
    reward_xp: float = Field(default=0.0)

    partner: Partner = Relationship(back_populates="completed_task_records")

class ViralGeneration(SQLModel, table=True):
    __table_args__ = (Index("idx_viral_gen_partner_created", "partner_id", "created_at"), {"extend_existing": True})
    id: int | None = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    topic: str
    audience: str
    language: str
    tone: str
    title: str
    body: str
    image_url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), index=True)

class SocialPost(SQLModel, table=True):
    __table_args__ = (
        Index("idx_social_post_gen_platform", "generation_id", "platform"),
        {"extend_existing": True}
    )
    id: int | None = Field(default=None, primary_key=True)
    generation_id: int | None = Field(default=None, foreign_key="viralgeneration.id", index=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    platform: str = Field(index=True) # "x", "telegram", "linkedin"
    external_id: str = Field(index=True) 
    channel_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), index=True)
    last_metric_check: datetime | None = None

class SocialPostMetric(SQLModel, table=True):
    __table_args__ = ({"extend_existing": True})
    id: int | None = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="socialpost.id", index=True)
    views: int = Field(default=0)
    likes: int = Field(default=0)
    reposts: int = Field(default=0)
    replies: int = Field(default=0)
    engagement_rate: float = Field(default=0.0)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), index=True)

class Earning(SQLModel, table=True):
    __table_args__ = (
        Index("idx_earning_partner_type_created", "partner_id", "type", "created_at"),
        Index("idx_earning_partner_created", "partner_id", "created_at"),
        UniqueConstraint("reference_id", name="uq_earning_reference_id"),
        {"extend_existing": True}
    )
    id: int | None = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True) # Optimized for user history
    amount: float
    description: str
    type: str = Field(default="COMMISSION", index=True) # COMMISSION, TASK_XP, REFERRAL_XP
    level: int | None = Field(default=None, index=True) # 1-9
    currency: str = Field(default="USDT", index=True) # USDT, XP
    reference_id: str | None = Field(default=None, index=True) # buyer_id:level or task_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), index=True)

class SystemSetting(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    key: str = Field(primary_key=True)
    value: str # JSON encoded string
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None), sa_column_kwargs={"onupdate": lambda: datetime.now(UTC).replace(tzinfo=None)}, index=True)

import sys

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# Standardized async database URL from settings
database_url = settings.async_database_url

# Validate database URL format
# Why: Catches common issues like wrong scheme (postgres:// vs postgresql://)
# or missing components (username, password, host, database name)
if database_url and not any(database_url.startswith(prefix) for prefix in ["postgresql+asyncpg://", "postgresql://", "sqlite"]):
    print(f"⚠️ WARNING: DATABASE_URL has unexpected format: {database_url[:20]}...", file=sys.stderr)
    print("   Expected: postgresql+asyncpg://... or postgresql://...", file=sys.stderr)

# SQLite specific arguments
connect_args = {"check_same_thread": False} if "sqlite" in database_url else {}

# #comment: Robust Engine configuration for multi-worker (4 Gunicorn) environments.
# pool_pre_ping=True ensures stale connections are discarded before use.
# pool_size and max_overflow are tuned to stay within Railway's Postgres connection limits
# across all workers and TaskIQ processes. pool_recycle helps with cloud firewalls.
engine_args = {
    "echo": settings.DEBUG,
    "future": True,
    "connect_args": connect_args,
    "pool_pre_ping": True,
}

if "sqlite" not in database_url:
    engine_args.update({
        "pool_size": 10,
        "max_overflow": 5,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    })

try:
    engine = create_async_engine(database_url, **engine_args)
except Exception as e:
    print(f"❌ CRITICAL ERROR: Failed to create database engine: {e}", file=sys.stderr)
    print("📋 Common causes:", file=sys.stderr)
    print("   1. Invalid DATABASE_URL format", file=sys.stderr)
    print("   2. Missing database driver (asyncpg)", file=sys.stderr)
    print("   3. Incorrect connection parameters", file=sys.stderr)
    sys.exit(1)

async def create_db_and_tables():
    # #comment: DB creation is now guarded in main.py lifespan, but the logic remains here.
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

# #comment: Single SessionMaker instance shared across the worker's event loop.
# This avoids the overhead of initializing the factory on every request.
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session():
    async with async_session_maker() as session:
        yield session

# Resolve Relationship string references
from app.models.transaction import PartnerTransaction
