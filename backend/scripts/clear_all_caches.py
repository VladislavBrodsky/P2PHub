
import asyncio
from app.services.redis_service import redis_service
from app.services.leaderboard_service import leaderboard_service
from sqlmodel import select
from app.models.partner import Partner, async_session_maker

async def clear_all_caches():
    """
    Clear all leaderboard and partner-related caches.
    Should be called after data restoration.
    """
    print("=" * 70)
    print("🔧 CLEARING ALL CACHES")
    print("=" * 70)
    
    # Clear leaderboard caches
    keys_to_clear = [
        "leaderboard:global",
        "leaderboard:top",
        "leaderboard:top10",
        "leaderboard:zset",
        "partners:top_v2",
        "partners:recent_v2",
        "partners:activity"
    ]
    
    cleared_count = 0
    for key in keys_to_clear:
        try:
            deleted = await redis_service.client.delete(key)
            if deleted:
                print(f"  ✅ Cleared: {key}")
                cleared_count += 1
        except Exception as e:
            print(f"  ⚠️  Error clearing {key}: {e}")
    
    # Rebuild Redis sorted set from database
    print("\n🔄 Rebuilding Redis leaderboard...")
    async with async_session_maker() as session:
        statement = select(Partner).limit(200)
        result = await session.exec(statement)
        all_users = result.all()
        
        sync_count = 0
        for user in all_users:
            try:
                await leaderboard_service.update_score(user.id, user.xp)
                sync_count += 1
            except Exception as e:
                print(f"  ⚠️  Error syncing user {user.id}: {e}")
        
        print(f"  ✅ Synced {sync_count} users to Redis")
    
    print("\n" + "=" * 70)
    print(f"✅ Cache clearing complete: {cleared_count} keys cleared")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(clear_all_caches())
