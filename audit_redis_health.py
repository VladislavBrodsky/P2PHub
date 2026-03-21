import asyncio
import logging
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("redis_audit")

async def audit_redis():
    logger.info("📡 Starting Redis Health Audit...")
    try:
        # 1. Ping
        res = await redis_service.client.ping()
        logger.info(f"✅ Redis Ping: {res}")
        
        # 2. Set/Get test
        await redis_service.client.set("health_check_test", "ok", ex=10)
        val = await redis_service.client.get("health_check_test")
        logger.info(f"✅ Redis Set/Get: {val}")
        
        # 3. Connection Pool Info
        pool = redis_service.client.connection_pool
        logger.info(f"📊 Pool Config: max_connections={pool.max_connections}")
        
        # 4. Check for @uslincoln profile cache
        uslincoln_id = 716720099
        profile = await redis_service.get_cached_profiles([uslincoln_id])
        if profile:
            logger.info(f"✅ @uslincoln profile found in cache.")
        else:
            logger.warning("⚠️ @uslincoln profile NOT in cache (expected if just purged).")

        logger.info("✨ Redis Audit Complete: All systems operational.")
        
    except Exception as e:
        logger.error(f"❌ Redis Audit Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(audit_redis())
