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
            Partner(telegram_id="962246779", username="alina_demirci", first_name="Alina", last_name="Demirci", photo_url="/images/telegram-cloud-photo-size-2-5341451183530381349-y.webp", referral_code=f"P2P-{uuid.uuid4().hex[:6].upper()}", created_at=datetime.utcnow()),
            Partner(telegram_id="5077095379", username="witkoil", first_name="WitKoiL", last_name="Axiom Labs", photo_url="/images/telegram-cloud-photo-size-2-5341660357027630593-y.webp", referral_code=f"P2P-{uuid.uuid4().hex[:6].upper()}", created_at=datetime.utcnow()),
            Partner(telegram_id="466695423", username="Ragvaloddd", first_name="Dmitriy", last_name="T", photo_url="/images/telegram-cloud-photo-size-2-5341660357027630691-y.webp", referral_code=f"P2P-{uuid.uuid4().hex[:6].upper()}", created_at=datetime.utcnow()),
            Partner(telegram_id="8164537543", username="PAO_web3", first_name="Paola", last_name="Suryana", photo_url="/images/telegram-cloud-photo-size-2-5341660357027630694-y.webp", referral_code=f"P2P-{uuid.uuid4().hex[:6].upper()}", created_at=datetime.utcnow()),
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
