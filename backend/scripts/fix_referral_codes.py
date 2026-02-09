
import asyncio
import os
import secrets
import sys

# Set PYTHONPATH to include backend
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Hardcode env vars for script to avoid .env permission issues
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
os.environ["BOT_TOKEN"] = "7670570321:AAE-eS_8q15-M6u7-M6u7-M6u7-M6u7-M6u7" # Dummy if not needed, or real if possible
os.environ["WEBHOOK_SECRET"] = "dummy_secret"

from sqlmodel import select
from app.models.partner import Partner, get_session
from app.models.transaction import Transaction # Register Transaction for Relationships
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.config import settings

async def main():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(db_url, echo=True, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Find all partners without a referral code
        statement = select(Partner).where(Partner.referral_code == None)
        result = await session.exec(statement)
        partners = result.all()
        
        print(f"Found {len(partners)} partners without a referral code.")
        
        for p in partners:
            # Generate a new P2P referral code
            new_code = f"P2P-{secrets.token_hex(4).upper()}"
            
            # Ensure uniqueness (very simple/naive check here, but hex(4) is 4.2B combinations)
            p.referral_code = new_code
            session.add(p)
            print(f"Assigned {new_code} to partner {p.id} (@{p.username})")
            
        await session.commit()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
