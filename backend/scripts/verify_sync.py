
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner

# Hardcoded for debugging
database_url = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(database_url, echo=False, future=True)

async def main():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    with open("verification_results.txt", "w") as f:
        f.write("Starting verification...\n")
        try:
            async with async_session() as session:
                statement = select(Partner).order_by(Partner.id.desc()).limit(1)
                result = await session.exec(statement)
                partner = result.first()

                if partner:
                    f.write(f"Found Partner: {partner.first_name} (ID: {partner.id})\n")
                    sample_photo = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&fm=webp"
                    partner.photo_url = sample_photo
                    session.add(partner)
                    await session.commit()
                    f.write(f"Successfully updated photo_url to: {sample_photo}\n")

                    # Verify
                    await session.refresh(partner)
                    f.write(f"Verified photo_url in DB: {partner.photo_url}\n")
                else:
                    f.write("No partners found.\n")
        except Exception as e:
            f.write(f"ERROR: {str(e)}\n")

if __name__ == "__main__":
    asyncio.run(main())
