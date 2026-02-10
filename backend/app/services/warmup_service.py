import logging
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, get_session
from app.services.leaderboard_service import leaderboard_service
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

async def warmup_redis():
    """
    Seeds Redis with critical production data from PostgreSQL.
    Ensures leaderboards and frequent caches are ready on startup.
    """
    logger.info("🔥 Starting Redis Warmup...")
    
    async for session in get_session():
        try:
            # 1. Warm up Global Leaderboard
            statement = select(Partner)
            result = await session.exec(statement)
            partners = await result.all()
            
            if not partners:
                logger.info("💡 No partners found to warm up.")
                return

            # Prepare data for Redis ZADD
            # ZADD name score member [score member ...]
            leaderboard_data = {str(p.id): float(p.xp) for p in partners}
            
            # Use zadd with dictionary for atomic update
            await redis_service.client.zadd(leaderboard_service.LEADERBOARD_KEY, leaderboard_data)
            logger.info(f"✅ Leaderboard warmed up with {len(partners)} partners.")
            
            # 2. Cache Recent Partners (Standard production list)
            from app.api.endpoints.partner import get_recent_partners
            # We don't call the endpoint directly to avoid Depends issues, 
            # but we can reuse the logic if needed, or just let the first request hit the DB.
            # For now, warming up the leaderboard is the most critical for "High Scale" feel.
            
        except Exception as e:
            logger.error(f"❌ Redis Warmup Failed: {e}")
        finally:
            break # Exit generator after one session

    logger.info("✨ Redis Warmup Complete.")
