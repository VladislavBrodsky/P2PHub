import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import os
import sys

# EXPLICIT CONFIG
DB_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

# Add the current directory to sys.path

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner


async def check_prod_stats():
    print("🔗 Connecting to Production Database...")
    engine = create_async_engine(DB_URL)
    session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with session_maker() as session:
        count = (await session.exec(select(func.count(Partner.id)))).one()
        print(f"📊 Total Partners in Production: {count}")
        
        # Get count of partners with photos
        photo_count = (await session.exec(select(func.count(Partner.id)).where(Partner.photo_file_id.isnot(None)))).one()
        print(f"📸 Partners with Photos: {photo_count}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_prod_stats())
