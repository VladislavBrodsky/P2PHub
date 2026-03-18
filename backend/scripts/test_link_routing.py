import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import os
import sys

from dotenv import load_dotenv

load_dotenv("backend/.env")

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import Partner
from app.services.viral_studio.studio import ViralMarketingStudio


async def run_test():
    url = settings.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    engine = create_async_engine(url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        stmt = select(Partner).where(Partner.username == "uslincoln")
        res = await session.exec(stmt)
        partner = res.first()
        
        studio = ViralMarketingStudio()
        
        # Test 1
        out1 = await studio.generate_viral_content(
            partner=partner,
            post_type="partners",
            target_audience="partners",
            language="English",
            tone_of_voice="authoritative",
            session=session
        )
        if "error" not in out1:
            print("=== GENERATED LINK TEST (PARTNERS) ===")
            print(out1['text'][-250:])
        else:
            print("ERROR 1:", out1)

        # Test 2
        out2 = await studio.generate_viral_content(
            partner=partner,
            post_type="launch",
            target_audience="partners",
            language="English",
            referral_link="https://t.me/pintopaybot?start=custom123"
        )
        print("=== GENERATED LINK TEST (CUSTOM URL) ===")
        print(out2.get('text', str(out2))[-250:])

if __name__ == "__main__":
    asyncio.run(run_test())
