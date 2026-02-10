import asyncio
import logging
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

from app.models.partner import get_session, Partner
from app.services.partner_service import create_partner, process_referral_logic
from sqlmodel import select

logging.basicConfig(level=logging.INFO)

async def simulate_referral():
    print("🚀 Simulating referral for @uslincoln (P2P-425DA3DB)...")
    
    async for session in get_session():
        # 1. Ensure uslincoln has the right code
        stmt = select(Partner).where(Partner.username == "uslincoln")
        res = await session.exec(stmt)
        referrer = res.first()
        if not referrer:
            print("❌ Referrer @uslincoln not found!")
            return
        
        print(f"✅ Found referrer: {referrer.username} (ID: {referrer.id}, Code: {referrer.referral_code})")

        # 2. Simulate new user registration
        new_tg_id = "999888777" # Random unique TG ID
        new_username = "test_friend"
        
        print(f"Creating new partner @{new_username} via code {referrer.referral_code}...")
        
        partner, is_new = await create_partner(
            session=session,
            telegram_id=new_tg_id,
            username=new_username,
            first_name="Test",
            last_name="Friend",
            referrer_code=referrer.referral_code
        )
        
        if is_new:
            print(f"✅ Created new partner: ID={partner.id}, Referrer ID={partner.referrer_id}")
            
            # 3. Manually run referral logic (instead of enqueuing to TaskIQ for this local test)
            print("Processing referral logic...")
            await process_referral_logic(partner.id)
            print("✅ Referral logic processed.")
            
            # 4. Check results
            await session.refresh(referrer)
            print(f"Referrer XP: {referrer.xp}")
            print(f"Referrer Referral Count: {referrer.referral_count}")
        else:
            print(" partner already exists, simulation limited.")

if __name__ == "__main__":
    asyncio.run(simulate_referral())
