import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
#!/usr/bin/env python3
import asyncio
import os
import sys
import time
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import redis.asyncio as redis

# Add backend to sys.path to import app.core.config
from app.core.config import settings

async def check_sql():
    print("--- SQL Database Check ---")
    url = settings.async_database_url
    print(f"Connecting to: {url.split('@')[-1] if '@' in url else url}")
    
    start_time = time.time()
    try:
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            # 1. Connectivity
            await conn.execute(text("SELECT 1"))
            print("✅ Connection successful")
            
            # 2. Version
            version = await conn.execute(text("SELECT version()"))
            print(f"✅ SQL Version: {version.scalar()}")
            
            # 3. Alembic Version
            try:
                alembic_res = await conn.execute(text("SELECT version_num FROM alembic_version"))
                alembic_v = alembic_res.scalar()
                print(f"✅ Alembic Version: {alembic_v}")
            except Exception:
                print("⚠️  alembic_version table not found")
                
            # 4. Critical Tables
            tables_to_check = ['partner', 'partnertransaction', 'notificationretry', 'xptransaction', 'earning']
            for table in tables_to_check:
                try:
                    res = await conn.execute(text(f'SELECT count(*) FROM "{table}"'))
                    count = res.scalar()
                    print(f"✅ Table '{table}': {count} records")
                except Exception as e:
                    print(f"❌ Table '{table}' check failed: {e}")
                    
        await engine.dispose()
        print(f"SQL Check completed in {time.time() - start_time:.2f}s")
        return True
    except Exception as e:
        print(f"🔥 SQL Check FAILED: {e}")
        return False

async def check_redis():
    print("\n--- Redis Check ---")
    url = settings.REDIS_URL
    print(f"Connecting to: {url}")
    
    start_time = time.time()
    try:
        r = redis.from_url(url)
        # 1. Connectivity
        pong = await r.ping()
        if pong:
            print("✅ Redis Connection successful (PONG)")
        
        # 2. Info
        info = await r.info()
        print(f"✅ Redis Version: {info.get('redis_version')}")
        print(f"✅ Connected Clients: {info.get('connected_clients')}")
        print(f"✅ Used Memory: {info.get('used_memory_human')}")
        
        # 3. Key Count
        dbsize = await r.dbsize()
        print(f"✅ Keys in DB: {dbsize}")
        
        await r.aclose()
        print(f"Redis Check completed in {time.time() - start_time:.2f}s")
        return True
    except Exception as e:
        print(f"🔥 Redis Check FAILED: {e}")
        return False

async def main():
    print("🚀 Starting P2PHub Production Health Check")
    print("=" * 40)
    
    sql_ok = await check_sql()
    redis_ok = await check_redis()
    
    print("\n" + "=" * 40)
    if sql_ok and redis_ok:
        print("✨ ALL SYSTEMS VERNAL! Health check passed.")
        sys.exit(0)
    else:
        print("🛑 HEALTH CHECK FAILED! Please check the logs above.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
