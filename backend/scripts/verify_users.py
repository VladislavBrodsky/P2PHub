import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

# Import the actual service functions to test API logic
from app.services.analytics_service import get_referral_tree_stats

async def main():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://")
        
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("\n🔍 VERIFYING TOP 5 ACCOUNTS THE WAY THE FRONTEND DOES 🔍")
        
        # Get top 5 users
        query = text("SELECT id, username, telegram_id, balance, xp, referral_count, path FROM partner ORDER BY referral_count DESC LIMIT 5")
        res = await session.execute(query)
        top_users = res.fetchall()
        
        for u in top_users:
            print(f"\n👤 Checking User: {u.username or u.telegram_id} (ID: {u.id})")
            print(f"  DB Values -> Balance: ${u.balance:.2f} | XP: {u.xp} | Direct Refs: {u.referral_count}")
            
            # Simulate what the frontend does to get Network Size
            tree_stats = await get_referral_tree_stats(session, u.id)
            network_size_real = sum(tree_stats.values())
            print(f"  Frontend Network Size (`_network_size_real` API Response): {network_size_real}")
            
            # Check levels breakdown
            first_three_levels = {k: tree_stats[k] for k in ["1", "2", "3"] if k in tree_stats}
            print(f"  Level Breakdown (1-3): {first_three_levels}")
            
            if network_size_real == 0 and u.referral_count > 0:
                print(f"  ⚠️ WARNING: DB has {u.referral_count} refs but Frontend API returns 0! PATH MIGHT BE CORRUPT FOR DESCENDANTS. (Path: {u.path})")
            elif network_size_real > 0:
                print(f"  ✅ SUCCESS: Frontend API is successfully resolving network stats for {u.username}.")

if __name__ == "__main__":
    asyncio.run(main())
