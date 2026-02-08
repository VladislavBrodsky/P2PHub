from app.models.partner import Partner, engine
from sqlmodel import Session
from datetime import datetime
import uuid

def seed():
    with Session(engine) as session:
        partners = [
            Partner(telegram_id=str(uuid.uuid4().int), username="satoshi", first_name="Satoshi", photo_url="https://ui-avatars.com/api/?name=Satoshi+N", referral_code="SATOSHI", created_at=datetime.utcnow()),
            Partner(telegram_id=str(uuid.uuid4().int), username="vitalik", first_name="Vitalik", photo_url="https://ui-avatars.com/api/?name=Vitalik+B", referral_code="VITALIK", created_at=datetime.utcnow()),
            Partner(telegram_id=str(uuid.uuid4().int), username="cz", first_name="CZ", photo_url="https://ui-avatars.com/api/?name=CZ", referral_code="CZBINANCE", created_at=datetime.utcnow()),
            Partner(telegram_id=str(uuid.uuid4().int), username="pavel", first_name="Pavel", photo_url="https://ui-avatars.com/api/?name=Pavel+D", referral_code="TELEGRAM", created_at=datetime.utcnow()),
        ]
        for p in partners:
            session.add(p)
        session.commit()
        print("Seeded 4 partners")

if __name__ == "__main__":
    seed()
