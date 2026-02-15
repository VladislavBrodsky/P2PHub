
import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.models.partner import Partner
from app.api.endpoints.pro import get_session
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

async def update_uslincoln():
    database_url = settings.async_database_url
    engine = create_async_engine(database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Find user by username
        stmt = select(Partner).where(Partner.username == "Uslincoln")
        result = await session.exec(stmt)
        partner = result.first()
        
        if not partner:
            # Try lowercase
            stmt = select(Partner).where(Partner.username == "uslincoln")
            result = await session.exec(stmt)
            partner = result.first()
            
        if not partner:
            print("❌ User @Uslincoln not found.")
            return

        print(f"✅ Found user: {partner.first_name} (@{partner.username}) ID: {partner.id}")

        # Update X Credentials
        partner.x_api_key = "XDpe00Su5EMSk3yTqUXfVZRjN"
        partner.x_api_secret = "E0emsJky5S9krByQJHszRHe5FR3my6ER5rDhqAjpjTHu8MWDCf"
        partner.x_access_token = "2013375449879945216-VGwNEm40NUGqH9uQMxxtnkYPikVTjh"
        partner.x_access_token_secret = "Z7VVomJZ6sKrLOiG6Hvob4zQHr5TArmIaFESk6cxV34zJ"
        
        # Update Telegram Channel
        # Assuming current is empty or replacing. If multiple logic handled in service, we just set the string here.
        # If user wants multiple, we can check. For now setting the requested one.
        partner.telegram_channel_id = "@pintopay_superapp"
        
        # Ensure PRO status
        partner.is_pro = True
        
        session.add(partner)
        await session.commit()
        print("✅ Successfully updated PRO settings for @Uslincoln")
        print(f"   X API Key: {partner.x_api_key[:5]}...")
        print(f"   Telegram Channel: {partner.telegram_channel_id}")

if __name__ == "__main__":
    asyncio.run(update_uslincoln())
