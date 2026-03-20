import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(os.getcwd())

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.partner import Partner, engine
from app.services.analytics_service import get_referral_tree_stats

async def check_partner_stats(partner_id: int):
    async with AsyncSession(engine) as session:
        partner = await session.get(Partner, partner_id)
        if not partner:
            print(f"❌ Partner {partner_id} NOT FOUND")
            return
            
        print(f"\n--- PARTNER {partner_id} ({partner.username}) ---")
        print(f"TG ID: {partner.telegram_id}")
        print(f"Referral Count (Stored): {partner.referral_count}")
        print(f"Path: {partner.path}")
        print(f"Is Test: {partner.is_test}")
        
        stats = await get_referral_tree_stats(session, partner_id)
        print(f"Real-time Tree Stats (is_test=False):")
        for lvl, count in stats.items():
            if count > 0:
                print(f"  Level {lvl}: {count}")
        print(f"Total Network Size: {sum(stats.values())}")
        print("--------------------\n")

if __name__ == "__main__":
    target_id = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    asyncio.run(check_partner_stats(target_id))
