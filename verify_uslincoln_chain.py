
import asyncio
import os
import sys

# Define base path
BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.core.config import settings
from app.models.partner import Partner
from sqlmodel import select, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

# Use the database URL from settings if available, or fall back to the one found in view_prod_partners.py
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def verify_chain():
    async with async_session_maker() as session:
        # 1. Find USLINCOLN
        stmt = select(Partner).where(Partner.username == "USLINCOLN")
        res = await session.exec(stmt)
        uslincoln = res.first()
        
        if not uslincoln:
            # Try case-insensitive
            stmt = select(Partner).where(Partner.username.ilike("USLINCOLN"))
            res = await session.exec(stmt)
            uslincoln = res.first()
            
        if not uslincoln:
            print("❌ User @USLINCOLN not found")
            return

        print(f"✅ Found USLINCOLN: ID={uslincoln.id}, TG={uslincoln.telegram_id}")

        # 2. Find Galaxy9999999 (Alexander)
        stmt = select(Partner).where(Partner.username == "Galaxy9999999")
        res = await session.exec(stmt)
        alexander = res.first()
        
        if not alexander:
            print("❌ User @Galaxy9999999 not found")
            return
            
        print(f"✅ Found Alexander: ID={alexander.id}, TG={alexander.telegram_id}, Path={alexander.path}")

        # 3. Trace the chain from Alexander up to USLINCOLN
        chain = []
        curr = alexander
        while curr and curr.referrer_id:
            stmt = select(Partner).where(Partner.id == curr.referrer_id)
            res = await session.exec(stmt)
            parent = res.first()
            if parent:
                chain.append(parent)
                if parent.id == uslincoln.id:
                    print("🚀 Chain leads to USLINCOLN!")
                    break
                curr = parent
            else:
                break
        
        print("\nReferral Chain (from bottom up):")
        print(f"Child: @{alexander.username} (Level 4?)")
        for i, p in enumerate(chain):
            print(f"Level {i+1} parent: @{p.username} (ID: {p.id})")
        
        if uslincoln in chain:
            depth = chain.index(uslincoln) + 1
            print(f"\nSUCCESS: @USLINCOLN is the L{depth} parent of @{alexander.username}")
        else:
            print(f"\nFAILURE: @USLINCOLN is NOT in the direct referral chain of @{alexander.username}")

if __name__ == "__main__":
    asyncio.run(verify_chain())
