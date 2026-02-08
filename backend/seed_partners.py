from app.models.partner import Partner, engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
import asyncio

async def seed():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Check if users exist first to avoid duplicates/errors if re-run
        # But uuid ensures unique telegram_id mostly... actually telegram_id is unique field.
        # Let's just try-except or check count
        
        partners = [
            Partner(telegram_id=str(uuid.uuid4().int)[:10], username="satoshi", first_name="Satoshi", last_name="Nakamoto", photo_url="https://ui-avatars.com/api/?name=Satoshi+N&background=random", referral_code=f"REF-{uuid.uuid4().hex[:6].upper()}", created_at=datetime.utcnow()),
            Partner(telegram_id=str(uuid.uuid4().int)[:10], username="vitalik", first_name="Vitalik", last_name="Buterin", photo_url="https://ui-avatars.com/api/?name=Vitalik+B&background=random", referral_code=f"REF-{uuid.uuid4().hex[:6].upper()}", created_at=datetime.utcnow()),
            Partner(telegram_id=str(uuid.uuid4().int)[:10], username="cz_binance", first_name="Changpeng", last_name="Zhao", photo_url="https://ui-avatars.com/api/?name=CZ&background=random", referral_code=f"REF-{uuid.uuid4().hex[:6].upper()}", created_at=datetime.utcnow()),
            Partner(telegram_id=str(uuid.uuid4().int)[:10], username="durov", first_name="Pavel", last_name="Durov", photo_url="https://ui-avatars.com/api/?name=Pavel+D&background=random", referral_code=f"REF-{uuid.uuid4().hex[:6].upper()}", created_at=datetime.utcnow()),
        ]
        
        for p in partners:
            try:
                session.add(p)
                await session.commit()
                print(f"Added {p.username}")
            except Exception as e:
                await session.rollback()
                print(f"Skipped {p.username}: {e}")

if __name__ == "__main__":
    asyncio.run(seed())
