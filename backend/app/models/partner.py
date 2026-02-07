from sqlmodel import SQLModel, Field, create_engine, Session, select
from typing import Optional
from app.core.config import settings

class Partner(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    telegram_id: str = Field(index=True, unique=True)
    username: Optional[str] = None
    first_name: Optional[str] = None
    balance: float = Field(default=0.0)
    level: int = Field(default=1)
    referral_code: str = Field(unique=True)

class Earning(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id")
    amount: float
    description: str
    created_at: str = Field(default="2026-02-07T00:00:00") # Simple timestamp for now

engine = create_engine(settings.DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
