
import asyncio
import random
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine

async def update_referral_counts():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find partners with 0 referrals that look like seeded users (or just all for variety)
        # Seeded users usually have names from our REAL_NAMES list
        statement = select(Partner)
        result = await session.exec(statement)
        partners = result.all()
        
        if not partners:
            print("❌ No partners found to update.")
            return

        print(f"🔄 Updating referral counts for {len(partners)} partners...")
        
        for p in partners:
            if p.username in ['uslincoln', 'pintopay_connect']:
                continue # Skip admin/main bot for now or set specifically if needed
            
            # Generate a realistic referral count based on their XP/Level
            # Higher XP usually means more referrals in a "real" scenario
            base = int(p.xp / 10) # 4750 XP -> ~475 referrals
            jitter = random.randint(-20, 50)
            
            p.referral_count = max(random.randint(5, 15), base + jitter)
            session.add(p)
            
        await session.commit()
        print("✅ Successfully updated all referral counts for a realistic look!")

if __name__ == "__main__":
    asyncio.run(update_referral_counts())
