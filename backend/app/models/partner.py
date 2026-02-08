from sqlmodel import SQLModel, Field, create_engine, Session, select
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
    balance: float = Field(default=0.0)
    level: int = Field(default=1)
    referral_code: str = Field(unique=True)
    referrer_id: Optional[int] = Field(default=None, foreign_key="partner.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Earning(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id")
    amount: float
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
