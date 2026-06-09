import asyncio
import os
import json
import redis.asyncio as redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

# Hardcoded Production URLs from verified scripts
REDIS_URL = "redis://default:HXYVAM4yGCiqfe23433445sdf34serwer3242144tX345o23HCOCbAIpqYNJKLAvMt423553454@shuttle.proxy.rlwy.net:58748"
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def master_audit():
    print("🚀 Starting Master Production Health Audit...")
    
    # 1. Redis Audit
    try:
        r_client = redis.from_url(REDIS_URL, decode_responses=True)
        ping = await r_client.ping()
        print(f"✅ Redis: Online (Ping: {ping})")
        
        uslincoln_cache_key = "profile_cache_v5:716720099"
        uslincoln_cache = await r_client.get(uslincoln_cache_key)
        if uslincoln_cache:
            print(f"✅ Redis: @uslincoln V5 Cache found.")
        else:
            print(f"ℹ️ Redis: @uslincoln V5 Cache missing (expected if purged).")
        await r_client.aclose()
    except Exception as e:
        print(f"❌ Redis: Failed connection: {e}")

    # 2. Database Audit
    try:
        engine = create_async_engine(DATABASE_URL)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            # Check connection
            await session.execute(text("SELECT 1"))
            print("✅ DB: Online (Connection successful)")
            
            # Check @uslincoln status
            res = await session.execute(text("SELECT id, username, is_pro, subscription_plan, xp FROM partner WHERE id = 1 OR username = 'USLINCOLN'"))
            user = res.fetchone()
            if user:
                print(f"✅ DB: User found - ID: {user[0]}, Username: {user[1]}")
                print(f"✅ DB: PRO Status: {user[2]}, Plan: {user[3]}, XP: {user[4]:.2f}")
                if user[3] == "PRO_PLUS_LIFETIME" and user[2]:
                    print("💎 DB: @uslincoln PRO+ Lifetime Status VERIFIED.")
                else:
                    print("⚠️ DB: @uslincoln PRO+ Status mismatch! (Plan: {}, is_pro: {})".format(user[3], user[2]))
            else:
                print("❌ DB: @uslincoln NOT found in database.")

            # Check Alembic version
            res = await session.execute(text("SELECT version_num FROM alembic_version"))
            version = res.scalar()
            print(f"✅ DB: Migration Version: {version}")

        await engine.dispose()
    except Exception as e:
        print(f"❌ DB: Failed connection: {e}")

    print("\n✨ Master Audit Complete.")

if __name__ == "__main__":
    asyncio.run(master_audit())
