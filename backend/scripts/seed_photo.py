
import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.partner import Partner, get_session
from app.models.transaction import PartnerTransaction
from app.core.config import settings
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

# Hardcoded for debugging (as discovered in previous steps)
database_url = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(database_url, echo=False, future=True)

async def main():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Get the most recent user (Diego Maradonna, ID 126 according to previous logs)
        statement = select(Partner).order_by(Partner.id.desc()).limit(1)
        result = await session.exec(statement)
        partner = result.first()
        
        if partner:
            print(f"Updating Partner: {partner.first_name} (ID: {partner.id})")
            # Using a high-quality Unsplash profile photo for demonstration
            sample_photo = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&fm=webp"
            partner.photo_url = sample_photo
            session.add(partner)
            await session.commit()
            print(f"Successfully updated photo_url to: {sample_photo}")
        else:
            print("No partners found to update.")

if __name__ == "__main__":
    asyncio.run(main())
