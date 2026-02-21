
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker

async def find_user(username_or_id):
    async with async_session_maker() as session:
        # 1. Try internal ID
        try:
            potential_id = int(username_or_id)
            partner = await session.get(Partner, potential_id)
            if partner:
                username_or_id = str(partner.telegram_id)
        except ValueError:
            pass

        if username_or_id.isdigit():
            stmt = select(Partner).where(Partner.telegram_id == username_or_id)
        else:
            stmt = select(Partner).where(Partner.username == username_or_id)
        
        res = await session.exec(stmt)
        partner = res.first()
        if partner:
            print(f"✅ Found: {partner.username} ({partner.telegram_id})")
            print(f"ID: {partner.id}")
            print(f"Is PRO: {partner.is_pro}")
            print(f"Plan: {partner.subscription_plan}")
            print(f"Referrer ID: {partner.referrer_id}")
            print(f"Referral Code: {partner.referral_code}")
            
            # Find recent referrals
            stmt_refs = select(Partner).where(Partner.referrer_id == partner.id).order_by(Partner.created_at.desc()).limit(10)
            res_refs = await session.exec(stmt_refs)
            refs = res_refs.all()
            print(f"\nRecent Referrals ({len(refs)}):")
            for r in refs:
                print(f"- @{r.username} ({r.telegram_id}) joined {r.created_at} | PRO: {r.is_pro}")
        else:
            print(f"❌ User {username_or_id} NOT FOUND")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 find_user.py <username_or_id>")
    else:
        asyncio.run(find_user(sys.argv[1]))
