import asyncio
import os
import sys
import json

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.models.partner import Partner
from app.models.schemas import PartnerResponse
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_serialization():
    async with async_session_maker() as session:
        from sqlalchemy.orm import selectinload
        stmt = select(Partner).where(Partner.username.ilike("uslincoln")).options(
            selectinload(Partner.completed_task_records),
            selectinload(Partner.referrals)
        )
        res = await session.exec(stmt)
        partner = res.first()
        
        if not partner:
            print("❌ Partner not found!")
            return
            
        # Simulate the model validation from profile.py
        # We model validate from the partner ORM object
        p_res = PartnerResponse.model_validate(partner)
        p_json = p_res.model_dump_json()
        data = json.loads(p_json)
        
        print("Serialized User Profile payload:")
        print(f"username: {data.get('username')}")
        print(f"is_pro: {data.get('is_pro')}")
        print(f"subscription_plan: {data.get('subscription_plan')}")
        print(f"is_pro_plus (computed_field): {data.get('is_pro_plus')}")
        print(f"pro_tokens: {data.get('pro_tokens')}")

if __name__ == "__main__":
    asyncio.run(check_serialization())
