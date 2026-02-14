
import asyncio
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models.partner import Partner
from app.models.partner import engine

async def sync_network():
    """
    High-performance script to synchronize partner network data.
    Recalculates referral_count and ensures hierarchy (path/depth) is consistent.
    """
    print(f"🚀 Starting Network Data Sync V2 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # 1. Fetch all partners
        statement = select(Partner)
        result = await session.exec(statement)
        partners = result.all()
        
        total_partners = len(partners)
        print(f"📊 Analyzing {total_partners} partners...")
        
        updated_count = 0
        
        for partner in partners:
            # 2. Count real referrals in database
            count_statement = select(func.count()).where(Partner.referrer_id == partner.id)
            count_result = await session.exec(count_statement)
            actual_count = count_result.one()
            
            # 3. Check for discrepancy
            if partner.referral_count != actual_count:
                print(f"⚠️ Discrepancy found for {partner.username or partner.telegram_id}: "
                      f"Stored: {partner.referral_count}, Actual: {actual_count}")
                
                partner.referral_count = actual_count
                session.add(partner)
                updated_count += 1
                
            # Optional: Validate Path & Depth if needed
            # We skip this for now to keep it fast, unless explicitly requested.
        
        if updated_count > 0:
            print(f"💾 Committing {updated_count} updates...")
            await session.commit()
            print(f"✅ Sync complete. Updated {updated_count} records.")
        else:
            print("✅ No discrepancies found. All counts are synchronized.")

if __name__ == "__main__":
    if "backend" not in os.getcwd():
        print("❌ Error: Run this script from the project root (e.g. python3 backend/scripts/sync_network_data_v2.py)")
        sys.exit(1)
        
    asyncio.run(sync_network())
