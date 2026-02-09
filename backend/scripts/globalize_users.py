
import asyncio
import os
import random
import json

# Set PYTHONPATH to include backend
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Hardcode env vars for script
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

from sqlmodel import select
from app.models.partner import Partner
from app.core.config import settings

# Diverse names data
NAMES_DATA = [
    {"first_name": "Dmitri", "last_name": "Ivanov", "username": "dmitri_iv", "country": "RU"},
    {"first_name": "Siddharth", "last_name": "Sharma", "username": "sid_india", "country": "IN"},
    {"first_name": "Isabella", "last_name": "Silva", "username": "bella_rio", "country": "BR"},
    {"first_name": "Yuki", "last_name": "Tanaka", "username": "yuki_tk", "country": "JP"},
    {"first_name": "Chinonso", "last_name": "Okonkwo", "username": "chi_vibe", "country": "NG"},
    {"first_name": "Mateo", "last_name": "Garcia", "username": "mateo_esp", "country": "ES"},
    {"first_name": "Elena", "last_name": "Petrova", "username": "elena_p", "country": "RU"},
    {"first_name": "Liam", "last_name": "O'Sullivan", "username": "liam_dublin", "country": "IE"},
    {"first_name": "Amina", "last_name": "Mansour", "username": "amina_dxb", "country": "AE"},
    {"first_name": "Arjun", "last_name": "Patel", "username": "arjun_web3", "country": "IN"},
    {"first_name": "Chloe", "last_name": "Lefebvre", "username": "chloe_paris", "country": "FR"},
    {"first_name": "Hans", "last_name": "Müller", "username": "hans_berlin", "country": "DE"},
    {"first_name": "Sofia", "last_name": "Rossi", "username": "sofia_roma", "country": "IT"},
    {"first_name": "Zhu", "last_name": "Wei", "username": "zhu_wei", "country": "CN"},
    {"first_name": "Santiago", "last_name": "Hernandez", "username": "santi_mx", "country": "MX"},
    {"first_name": "Aarav", "last_name": "Kumar", "username": "aarav_k", "country": "IN"},
    {"first_name": "Fatima", "last_name": "Zahra", "username": "fatima_z", "country": "MA"},
    {"first_name": "Oliver", "last_name": "Smith", "username": "ollie_uk", "country": "UK"},
    {"first_name": "Isla", "last_name": "McGregor", "username": "isla_scot", "country": "UK"},
    {"first_name": "Lars", "last_name": "Svensson", "username": "lars_sw", "country": "SE"},
]

async def main():
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy.orm import sessionmaker
        from sqlmodel.ext.asyncio.session import AsyncSession
        
        db_url = os.environ["DATABASE_URL"]
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        engine = create_async_engine(db_url, echo=True, future=True)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Query all partners that look like test users or have "None" names
            statement = select(Partner).where(
                (Partner.first_name.like("TestUser%")) | 
                (Partner.first_name == None) |
                (Partner.username.like("TestUser%"))
            )
            result = await session.exec(statement)
            partners = result.all()
            
            print(f"Globalizing {len(partners)} partners...")
            
            for i, p in enumerate(partners):
                # Pick a name and identity
                identity = NAMES_DATA[i % len(NAMES_DATA)]
                
                # Update attributes
                p.first_name = identity["first_name"]
                p.last_name = identity["last_name"]
                # Append a small random number to username to keep it somewhat unique if many users
                p.username = f"{identity['username']}_{random.randint(10, 99)}"
                
                # Assign a Dicebear avatar URL based on the name (avataaars)
                # Seed with username to ensure they stay the same
                p.photo_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={p.username}&backgroundColor=b6e3f4,c0aede,d1d4f9"
                
                session.add(p)
                print(f"Updated ID {p.id}: {p.first_name} (@{p.username})")
                
            await session.commit()
            print("Successfully globalized all test users!")
            
    except Exception as e:
        print(f"Error during globalization: {e}")

if __name__ == "__main__":
    asyncio.run(main())
