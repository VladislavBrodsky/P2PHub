
import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
import json
import os
import sys

# Production DB from view_prod_partners.py (assuming it's correct)
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

# Ensure backend is in path
sys.path.append("/Users/grandmaestro/Developer/P2PHub/backend")

async def inspect_user():
    from app.models.partner import Partner
    engine = create_async_engine(DATABASE_URL)
    async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username == "lownocoder_TMR")
        result = await session.exec(stmt)
        partner = result.first()
        
        if not partner:
            print("User @lownocoder_TMR not found.")
            return

        print(f"User Found: {partner.username}")
        print(f"Telegram ID: {partner.telegram_id}")
        print(f"Current XP: {partner.xp}")
        print(f"Academy Score: {partner.academy_score}")
        print(f"Completed Stages: {partner.completed_stages}")
        
        # Analyze completed stages for duplicates or excess
        try:
            completed = json.loads(partner.completed_stages or "[]")
            print(f"Total entries in completed_stages: {len(completed)}")
            unique_stages = set(completed)
            print(f"Unique stages: {len(unique_stages)}")
            
            if len(completed) > len(unique_stages):
                print(f"⚠️ Detected {len(completed) - len(unique_stages)} duplicate completions.")
                
                # We could attempt to calculate the "excess" XP here if we knew the value of each stage.
                # But for now, let's just see the data.
        except Exception as e:
            print(f"Error parsing completed_stages: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_user())
