import asyncio
import os
import json
import redis.asyncio as redis

async def verify_redis():
    redis_url = "redis://default:HXYVAM4yGCiqfe23433445sdf34serwer3242144tX345o23HCOCbAIpqYNJKLAvMt423553454@shuttle.proxy.rlwy.net:58748"
    
    try:
        client = redis.from_url(redis_url, decode_responses=True, socket_timeout=10.0)
        
        # Check Leaderboard
        print("🏆 Checking Leaderboard Data...")
        top_users = await client.zrevrange("leaderboard:global", 0, 4, withscores=True)
        print(f"Top 5 Global: {top_users}")
        
        # Check a sample profile cache if any exists
        profile_keys = await client.keys("profile_cache_v3:*")
        if profile_keys:
            sample_key = profile_keys[0]
            profile_data = await client.get(sample_key)
            print(f"\n👤 Sample Profile Cache ({sample_key}):")
            try:
                parsed = json.loads(profile_data)
                print(json.dumps(parsed, indent=2))
            except:
                print(f"  Raw: {profile_data[:100]}...")
        
        # Check system config if cached
        config_key = "public_config_cache"
        config_data = await client.get(config_key)
        if config_data:
            print(f"\n⚙️ Cached Public Config:")
            print(config_data)
            
        await client.aclose()
        
    except Exception as e:
        print(f"❌ Redis Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_redis())
