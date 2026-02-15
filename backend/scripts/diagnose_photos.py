#!/usr/bin/env python3
"""
Diagnostic script to check profile photo flow.
Tests the complete flow: DB -> Redis -> Telegram -> Cache
"""

import asyncio
import os
import sys

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# Load .env manually
env_path = os.path.join(parent_dir, ".env")
if os.path.exists(env_path):
    print(f"📄 Loading environment from {env_path}")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                try:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip().strip("'").strip('"')
                except ValueError:
                    pass
else:
    print(f"⚠️ .env file not found at {env_path}")

from sqlalchemy.ext.asyncio import create_async_engine


async def diagnose_photo_flow():
    from sqlmodel import select

    from app.models.partner import Partner, async_session_maker
    from app.services.partner_service import ensure_photo_cached
    from app.services.redis_service import redis_service
    from bot import bot
    
    print("=" * 70)
    print("🔍 PROFILE PHOTO FLOW DIAGNOSTICS")
    print("=" * 70)
    
    async with async_session_maker() as session:
        # Get recent partners
        stmt = select(Partner).order_by(Partner.created_at.desc()).limit(10)
        result = await session.exec(stmt)
        partners = result.all()
        
        print(f"\n📊 Testing {len(partners)} most recent partners:\n")
        
        for i, partner in enumerate(partners, 1):
            print(f"{i}. {partner.first_name} (@{partner.username})")
            print(f"   Telegram ID: {partner.telegram_id}")
            print(f"   Photo File ID: {partner.photo_file_id or 'NONE ⚠️'}")
            
            if partner.photo_file_id:
                # Test Redis cache
                cache_key = f"tg_photo_bin_v1:{partner.photo_file_id}"
                cached = await redis_service.get_bytes(cache_key)
                
                if cached:
                    print(f"   ✅ Redis Cache: {len(cached)} bytes")
                else:
                    print("   ⚠️ Redis Cache: MISS")
                    
                    # Try to fetch and cache
                    print("   🔄 Attempting to fetch from Telegram...")
                    try:
                        import time
                        start = time.time()
                        result = await ensure_photo_cached(partner.photo_file_id)
                        elapsed = (time.time() - start) * 1000
                        
                        if result:
                            print(f"   ✅ Fetched and cached: {len(result)} bytes in {elapsed:.0f}ms")
                        else:
                            print(f"   ❌ Failed to fetch (took {elapsed:.0f}ms)")
                    except Exception as e:
                        print(f"   ❌ Error: {e}")
            print()
        
        # Check system health
        print("=" * 70)
        print("🏥 SYSTEM HEALTH")
        print("=" * 70)
        
        # Redis connectivity
        try:
            await redis_service.client.ping()
            print("✅ Redis: Connected")
        except Exception as e:
            print(f"❌ Redis: {e}")
        
        # Bot connectivity
        try:
            me = await bot.get_me()
            print(f"✅ Telegram Bot: @{me.username}")
        except Exception as e:
            print(f"❌ Telegram Bot: {e}")
        
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(diagnose_photo_flow())
