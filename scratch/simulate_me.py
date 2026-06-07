import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

from app.core.config import settings
from app.models.partner import Partner
from app.models.schemas import PartnerResponse
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker, selectinload

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test_simulate():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.telegram_id == "716720099").options(
            selectinload(Partner.completed_task_records),
            selectinload(Partner.referrals)
        )
        res = await session.exec(stmt)
        partner = res.first()
        if not partner:
            print("User 716720099 not found in database!")
            return
            
        print(f"Partner in DB: username={partner.username}, is_pro={partner.is_pro}, subscription_plan={partner.subscription_plan}")
        
        partner_response = PartnerResponse.model_validate(partner)
        partner_response.is_admin = str(partner.telegram_id) in settings.ADMIN_USER_IDS
        
        print("PartnerResponse:")
        print(f"  username: {partner_response.username}")
        print(f"  is_admin: {partner_response.is_admin}")
        print(f"  is_pro: {partner_response.is_pro}")
        print(f"  is_pro_plus: {partner_response.is_pro_plus}")
        print(f"  subscription_plan: {partner_response.subscription_plan}")

if __name__ == "__main__":
    asyncio.run(test_simulate())
