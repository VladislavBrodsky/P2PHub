import asyncio
import logging

from sqlmodel import select

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
            # 1. Warmup Global Leaderboard - Optimized & Limited
            # Only load top 1000 users to prevent startup hang
            statement = select(Partner.id, Partner.xp).order_by(Partner.xp.desc()).limit(1000)

            # Use stream() to iterate without loading all into memory
            batch_size = 1000
            current_batch = {}
            count = 0

            # Streaming results allows us to yield control to event loop
            stream_result = await session.stream(statement)

            async for row in stream_result:
                # row is a Result object where row[0] is id, row[1] is xp (since we selected specific columns)
                # or it acts like a tuple depending on SQLModel version.
                # Let's assume row is the tuple (id, xp)
                p_id, p_xp = row
                current_batch[str(p_id)] = float(p_xp)
                count += 1

                if len(current_batch) >= batch_size:
                    await redis_service.client.zadd(leaderboard_service.LEADERBOARD_KEY, current_batch)
                    current_batch = {}
                    # Yield control to allow health checks to pass during heavy processing
                    await asyncio.sleep(0.1) # Reduced sleep for faster warmup while still yielding control

            # Flush remaining
            if current_batch:
                await redis_service.client.zadd(leaderboard_service.LEADERBOARD_KEY, current_batch)

            if count == 0:
                logger.info("💡 No partners found to warm up.")
            else:
                logger.info(f"✅ Leaderboard warmed up with {count} partners (Streamed).")

            # 2. Warmup Recent Partners (Social Proof)
            from app.api.endpoints.partner import get_recent_partners
            logger.info("📡 Warming up Recent Partners cache...")
            await get_recent_partners(limit=10, session=session)
            logger.info("✅ Recent Partners cache warmed up.")

        except Exception as e:
            logger.error(f"❌ Redis Warmup Failed: {e}")
        finally:
            break

    logger.info("✨ Redis Warmup Complete.")
