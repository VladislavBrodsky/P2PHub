import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import asyncio
import logging
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.services.partner_service import migrate_paths
from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)

async def main():
    print("🚀 Starting Data Migration & Cache Flush 🚀")
    
    # 1. DB Migration
    print("\n--- 1. Migrating Database Paths ---")
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://")
        
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        await migrate_paths(session)
        print("✅ Database paths migrated successfully.")

    # 2. Redis Flush
    print("\n--- 2. Flushing Redis Cache ---")
    try:
        keys = await redis_service.client.keys("ref_tree_stats_v2:*")
        if keys:
            await redis_service.client.delete(*keys)
            print(f"✅ Flushed {len(keys)} tree stats cache keys.")
        else:
            print("✅ No tree stats cache keys found to flush.")

        keys_members = await redis_service.client.keys("ref_tree_members_v2:*")
        if keys_members:
            await redis_service.client.delete(*keys_members)
            print(f"✅ Flushed {len(keys_members)} tree members cache keys.")
        else:
            print("✅ No tree members cache keys found.")
            
        # Also flush regular stats just in case
        growth_keys = await redis_service.client.keys("growth_metrics:*")
        if growth_keys:
            await redis_service.client.delete(*growth_keys)
            print(f"✅ Flushed {len(growth_keys)} growth metric cache keys.")

    except Exception as e:
        print(f"⚠️ Redis flush warning: {e}")

    print("\n🎉 All done! Stats should now be live.")

if __name__ == "__main__":
    asyncio.run(main())
