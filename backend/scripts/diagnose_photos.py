#!/usr/bin/env python3
"""
Diagnostic script to check profile photo flow.
Tests the complete flow: DB -> Redis -> Telegram -> Cache
"""

import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def diagnose_photo_flow():
    from app.models.partner import async_session_maker, Partner
    from sqlmodel import select
    from app.services.redis_service import redis_service
    from app.services.partner_service import ensure_photo_cached
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
                    print(f"   ⚠️ Redis Cache: MISS")
                    
                    # Try to fetch and cache
                    print(f"   🔄 Attempting to fetch from Telegram...")
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
