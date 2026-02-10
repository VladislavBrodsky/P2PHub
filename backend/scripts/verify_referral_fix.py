import asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
import json
import os

# Set up DB
DATABASE_URL = "sqlite+aiosqlite:///backend/dev.db"
from sqlalchemy.ext.asyncio import create_async_engine
engine = create_async_engine(DATABASE_URL)

# Import the functions
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.services.partner_service import get_referral_tree_stats, get_referral_tree_members

async def verify():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # User 100 is Abraham (uslincoln)
        partner_id = 100
        
        print("\n--- Verifying Tree Stats ---")
        stats = await get_referral_tree_stats(session, partner_id)
        print(f"Stats Keys: {list(stats.keys())}")
        print(f"Stats Values: {stats}")
        
        # Check if keys match level_1, level_2, etc.
        assert "level_1" in stats
        assert "level_9" in stats
        
        print("\n--- Verifying Tree Members Level 1 ---")
        members = await get_referral_tree_members(session, partner_id, 1)
        print(f"Members L1 Count: {len(members)}")
        if members:
            m = members[0]
            print(f"Member Sample Keys: {list(m.keys())}")
            print(f"Member Sample: {m}")
            
            # Check for required fields in PartnerResponse
            required = ["id", "telegram_id", "xp", "level", "referral_code", "is_pro", "created_at", "updated_at", "balance"]
            for r in required:
                if r not in m:
                    print(f"MISSING FIELD: {r}")
                else:
                    print(f"Field {r}: {m[r]}")

if __name__ == "__main__":
    asyncio.run(verify())
