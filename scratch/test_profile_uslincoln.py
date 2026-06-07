import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.models.partner import Partner
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test_get_profile():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username.ilike("uslincoln"))
        result = await session.exec(stmt)
        partner = result.first()
        if not partner:
            print("Not found")
            return
        print(f"partner: {partner.username}, is_pro: {partner.is_pro}, plan: {partner.subscription_plan}")
        print(f"xp: {partner.xp}, type: {type(partner.xp)}")
        
        # Test serialization / get_my_profile logic
        from app.models.schemas import PartnerResponse
        from app.services.analytics_service import get_referral_tree_stats
        
        try:
            tree_stats = await get_referral_tree_stats(session, partner.id)
            print(f"tree_stats: {tree_stats}")
            
            partner_response = PartnerResponse.from_orm(partner)
            partner_response.network_size_real = sum(tree_stats.values())
            partner_response.xp = round(float(partner.xp), 2)
            data_to_cache = partner_response.model_dump(mode='json')
            print("Success serializing partner profile")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_get_profile())
