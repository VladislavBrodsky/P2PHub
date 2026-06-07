import asyncio
import os
import sys
from datetime import datetime, UTC, timedelta

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.models.partner import Partner, XPTransaction, Earning
from sqlmodel import select, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test_me_logic():
    async with async_session_maker() as session:
        # Fetch partner exactly like the endpoint
        tg_id = "716720099" # @uslincoln
        stmt = select(Partner).where(Partner.telegram_id == tg_id).options(
            selectinload(Partner.completed_task_records),
            selectinload(Partner.referrals)
        )
        result = await session.exec(stmt)
        partner = result.first()
        if not partner:
            print("Partner not found")
            return
            
        print(f"Loaded partner username: {partner.username}")
        
        # Self-healing logic
        my_search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
        actual_total_size = (await session.execute(
            text("SELECT COUNT(*) FROM partner WHERE (path = :p OR path LIKE :pw) AND is_test = false"),
            {"p": my_search_path, "pw": f"{my_search_path}.%"}
        )).scalar() or 0
        
        print(f"Self-healing: referral_count in DB = {partner.referral_count}, actual_total_size = {actual_total_size}")
        
        # Daily check-in logic
        now_dt = datetime.now(UTC).replace(tzinfo=None)
        today_date = now_dt.date()
        checkin_ref = f"checkin_{partner.id}_{today_date.strftime('%Y-%m-%d')}"
        existing_checkin_today = (await session.exec(
            select(XPTransaction).where(XPTransaction.reference_id == checkin_ref).limit(1)
        )).first()
        print(f"Today checkin exists: {bool(existing_checkin_today)}")
        
        # Serialization step
        try:
            from app.models.schemas import PartnerResponse
            partner_response = PartnerResponse.from_orm(partner)
            print("from_orm serialization passed")
            
            # tree stats step
            from app.services.analytics_service import get_referral_tree_stats
            tree_stats = await get_referral_tree_stats(session, partner.id)
            partner_response.network_size_real = sum(tree_stats.values())
            
            # rounding xp
            partner_response.xp = round(float(partner.xp), 2)
            
            # serialize config
            data_to_cache = partner_response.model_dump(mode='json')
            print("Full serialization passed successfully")
            print(f"is_pro: {partner_response.is_pro}, is_pro_plus: {partner_response.is_pro_plus}")
        except Exception as e:
            print("Exception during serialization/stats calculation:", file=sys.stderr)
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_me_logic())
