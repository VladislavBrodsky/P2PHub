
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


async def reset_stats():
    # Fix for Railway providing postgresql:// or postgres:// but SQLAlchemy requiring postgresql+asyncpg://
    database_url = settings.DATABASE_URL
    if database_url:
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    print("Connecting to DB to reset stats...")
    engine = create_async_engine(database_url)

    async with engine.begin() as conn:
        # Delete the persistent snapshot and count to force a refresh with new range
        print("Deleting 'partners_recent_snapshot' and 'partners_recent_last_hour_count'...")
        await conn.execute(text("DELETE FROM systemsetting WHERE key IN ('partners_recent_snapshot', 'partners_recent_last_hour_count')"))
        print("Stats reset successful in DB.")

    # 2. Clear Redis Cache
    try:
        from app.services.redis_service import redis_service
        print("Clearing Redis cache 'partners:recent'...")
        await redis_service.client.delete("partners:recent")
        print("Redis cache cleared.")
    except Exception as e:
        print(f"Failed to clear Redis: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_stats())
