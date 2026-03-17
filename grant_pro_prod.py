
import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add backend to path to import models
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_dir, "backend")
if os.path.exists(backend_path):
    sys.path.append(backend_path)
else:
    # If run from within backend/
    sys.path.append(current_dir)

from app.models.partner import Partner
from app.services.partner_service import create_partner

# Production DB
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def grant_pro(tg_id: str):
    async with async_session_maker() as session:
        # Check if exists
        stmt = select(Partner).where(Partner.telegram_id == tg_id)
        result = await session.exec(stmt)
        partner = result.first()
        
        if not partner:
            print(f"Creating new partner {tg_id}...")
            partner, is_new = await create_partner(
                session=session,
                telegram_id=tg_id,
                username="antigravity_test",
                first_name="Anti",
                last_name="Gravity",
                language_code="en"
            )
            print(f"Partner created with ID {partner.id}")
        
        print(f"Granting PRO to {tg_id}...")
        partner.is_pro = True
        partner.xp = 1000 # Give some XP
        partner.level = 5
        session.add(partner)
        await session.commit()
        print("PRO granted successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python grant_pro.py <telegram_id>")
        sys.exit(1)
    asyncio.run(grant_pro(sys.argv[1]))
