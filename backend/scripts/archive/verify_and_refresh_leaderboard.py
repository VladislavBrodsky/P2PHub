
import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.partner import Partner

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL is not set!")
        return
        
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("=" * 70)
        print("🔍 VERIFYING TOP 5 LEADERBOARD")
        print("=" * 70)
        
        # Get top 5 by XP
        statement = select(Partner).order_by(Partner.xp.desc()).limit(5)
        result = await session.exec(statement)
        users = result.all()
        
        print("\nCurrent Top 5:\n")
        
        for i, user in enumerate(users, 1):
            print(f"Rank #{i}")
            print(f"  Name: {user.first_name} {user.last_name or ''}")
            print(f"  Username: @{user.username}")
            print(f"  XP: {user.xp}")
            print(f"  Telegram ID: {user.telegram_id}")
            print(f"  Photo URL: {user.photo_url}")
            print()
        
        print("=" * 70)
        print("🔧 CLEARING LEADERBOARD CACHE")
        print("=" * 70)
        
        # Connect to Redis and clear leaderboard cache
        try:
            from app.services.redis_service import redis_service
            
            # Clear various leaderboard-related caches
            keys_to_clear = [
                "leaderboard:global",
                "leaderboard:top",
                "leaderboard:top10",
                "leaderboard:zset",
                "partners:top_v2"
            ]
            
            for key in keys_to_clear:
                deleted = await redis_service.client.delete(key)
                if deleted:
                    print(f"  ✅ Cleared: {key}")
                else:
                    print(f"  ℹ️  Not found: {key}")
            
            # Also sync the Redis sorted set with current XP values
            print("\n🔄 Syncing Redis leaderboard with database...")
            from app.services.leaderboard_service import leaderboard_service
            
            # Get all partners and update their scores
            all_statement = select(Partner).limit(200)
            all_result = await session.exec(all_statement)
            all_users = all_result.all()
            
            sync_count = 0
            for user in all_users:
                await leaderboard_service.update_score(user.id, user.xp)
                sync_count += 1
            
            print(f"  ✅ Synced {sync_count} users to Redis leaderboard")
            
        except Exception as e:
            print(f"  ❌ Error clearing cache: {e}")
        
        print("\n" + "=" * 70)
        print("✅ VERIFICATION COMPLETE")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
