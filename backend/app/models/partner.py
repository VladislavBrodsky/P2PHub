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
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Earning(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id")
    amount: float
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

engine = create_engine(settings.DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
