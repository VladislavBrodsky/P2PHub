import asyncio
import os
import sys

from sqlmodel import select, text

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner, engine


async def debug_user(telegram_id: str):
    async with AsyncSession(engine) as session:
        # 1. Check the user
        stmt = select(Partner).where(Partner.telegram_id == telegram_id)
        res = await session.exec(stmt)
        user = res.first()

        if not user:
            print(f"❌ User with Telegram ID {telegram_id} not found in DB.")
            return

        print(f"✅ User Found: ID={user.id}, TG={user.telegram_id}, Path={user.path}, RefCode={user.referral_code}")

        # 2. Check direct referrals
        stmt = select(Partner).where(Partner.referrer_id == user.id)
        res = await session.exec(stmt)
        referrals = res.all()
        print(f"📊 Direct Referrals Found: {len(referrals)}")
        for r in referrals:
            print(f"   - ID={r.id}, TG={r.telegram_id}, Path={r.path}")

        # 3. Check tree stats via manual count to compare (Corrected Logic)
        parent_path = user.path or ""
        base_path = f"{parent_path}.{user.id}".lstrip(".")
        print(f"🔍 Testing base_path: {base_path}")

        stmt = text("SELECT COUNT(*) FROM partner WHERE path = :path OR path LIKE :path || '.%'")
        res = await session.execute(stmt, {"path": base_path})
        tree_count = res.scalar()
        print(f"🌲 Tree Count (Path-based): {tree_count}")

if __name__ == "__main__":
    tg_id = "716720099"
    asyncio.run(debug_user(tg_id))
