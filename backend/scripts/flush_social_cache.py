
import asyncio

from app.services.redis_service import redis_service


# #comment Cache management script to clear stale social proof and leaderboard data.
# This ensures that naming and avatar corrections are immediately visible to users.
async def main():
    print('🧼 Flushing leaderboard and recent partners cache...')
    # Pattern includes 'leaderboard:*' and 'partners:recent' etc.
    keys_to_clear = [
        'leaderboard:global_hydrated:50',
        'leaderboard:global_hydrated:20',
        'partners:recent',
        'partners:activity'
    ]
    for key in keys_to_clear:
        try:
            await redis_service.delete(key)
            print(f'✅ Cleared: {key}')
        except Exception as e:
            print(f'⚠️ Failed to clear {key}: {e}')
    
    # Also delete pattern for general leaderboard keys
    try:
        await redis_service.delete_pattern('leaderboard:*')
        print('✅ Pattern leaderboard:* cleared!')
    except Exception as e:
        print(f'⚠️ Pattern clear failed: {e}')
        
    print('✨ Cache maintenance complete!')

if __name__ == "__main__":
    asyncio.run(main())
