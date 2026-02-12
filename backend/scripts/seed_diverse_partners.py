import asyncio
import uuid
import random
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.models.partner import Partner, XPTransaction, engine

REAL_NAMES = [
    'Alex_Crypto', 'Sarah.Web3', 'Dmitry_TON', 'Elena ✨', 'Maxim💸',
    'Julia_S', 'Andrey.eth', 'Natasha⚡️', 'Sergey_PRO', 'Olga_K',
    'Ivan_Investor', 'Marina.Digital', 'Artur_Hub', 'Svetlana💎', 'Pavel_X',
    'CryptoWhale', 'Nikita_Dev', 'Anna.Slovo', 'Vitaliy_🔥', 'Katerina_M',
    'Den_Rich', 'Alena_Marketing', 'Oleg_Strategy', 'Viktoria🚀', 'Stas_Zero'
]

async def seed():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("🌱 Seeding diverse partners...")
        
        for name in REAL_NAMES:
            # Check if exists
            stmt = select(Partner).where(Partner.username == name.lower().replace('.', '_'))
            existing = (await session.exec(stmt)).first()
            if existing:
                continue

            # Create Partner
            tg_id = str(random.randint(100000000, 999999999))
            xp = random.randint(50, 5000)
            created_at = datetime.utcnow() - timedelta(days=random.randint(0, 10), hours=random.randint(0, 23))
            
            p = Partner(
                telegram_id=tg_id,
                username=name.lower().replace('.', '_').replace(' ', ''),
                first_name=name.split('_')[0].split('.')[0].split(' ')[0],
                last_name=None,
                xp=xp,
                referral_code=f"P2P-{secrets.token_hex(3).upper()}",
                created_at=created_at,
                updated_at=created_at,
                level=max(1, xp // 1000)
            )
            
            session.add(p)
            await session.flush() # Get ID
            
            # Add some transactions for this partner to populate the activity feed
            types = ['REFERRAL_L1', 'TASK', 'LEVEL_UP']
            for _ in range(random.randint(1, 3)):
                tx_type = random.choice(types)
                tx_created = p.created_at + timedelta(minutes=random.randint(1, 1440))
                if tx_created > datetime.utcnow(): tx_created = datetime.utcnow()
                
                tx = XPTransaction(
                    partner_id=p.id,
                    amount=random.choice([10, 50, 100, 250]),
                    type=tx_type,
                    description=f"Simulated {tx_type}",
                    created_at=tx_created
                )
                session.add(tx)
        
        await session.commit()
        print("✅ Successfully seeded diverse partners and activity!")

if __name__ == "__main__":
    asyncio.run(seed())
