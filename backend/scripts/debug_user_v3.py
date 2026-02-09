import asyncio
import sys
import os
from sqlmodel import select, text
from sqlalchemy.orm import selectinload

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import Partner, engine
from sqlmodel.ext.asyncio.session import AsyncSession

async def debug_user(telegram_id: str):
    async with AsyncSession(engine) as session:
        # 1. Check the user
        stmt = select(Partner).where(Partner.telegram_id == telegram_id)
        res = await session.exec(stmt)
        user = res.first()
        
        if not user:
            print(f"❌ User with Telegram ID {telegram_id} not found in DB.")
            return

        print(f"✅ User Found: ID={user.id}, TG={user.telegram_id}, Path={user.path}")
        
        # 2. Check direct referrals and their paths
        stmt = select(Partner).where(Partner.referrer_id == user.id)
        res = await session.exec(stmt)
        referrals = res.all()
        print(f"📊 Direct Referrals Total: {len(referrals)}")
        for r in referrals:
            print(f"   - ID={r.id}, TG={r.telegram_id}, Path='{r.path}'")

        # 3. Check tree stats via manual count to compare
        parent_path = user.path or ""
        base_path = f"{parent_path}.{user.id}".lstrip(".")
        print(f"🔍 Searching for path='{base_path}' or path LIKE '{base_path}.%'")
        
        stmt = text("SELECT id, telegram_id, path FROM partner WHERE path = :path OR path LIKE :path || '.%'")
        res = await session.execute(stmt, {"path": base_path})
        matches = res.all()
        print(f"🌲 Tree Members Found ({len(matches)}):")
        for m in matches:
            print(f"   - ID={m.id}, TG={m.telegram_id}, Path='{m.path}'")

if __name__ == "__main__":
    tg_id = "716720099"
    asyncio.run(debug_user(tg_id))
