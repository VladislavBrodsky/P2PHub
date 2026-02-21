
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker

async def check():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username == 'pintopayhelp')
        p = (await session.exec(stmt)).first()
        if not p:
            print("pintopayhelp not found")
            return
            
        stmt2 = select(Partner).where(Partner.referrer_id == p.id)
        refs = (await session.exec(stmt2)).all()
        
        print(f"pintopayhelp ID: {p.id}. Referrals count: {len(refs)}")
        for r in refs:
            print(f"- {r.created_at} | {r.username} (ID: {r.id})")

if __name__ == "__main__":
    asyncio.run(check())
