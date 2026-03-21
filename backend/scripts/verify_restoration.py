import asyncio
from sqlmodel import select, func
from app.models.partner import Partner, async_session_maker

async def verify_stats():
    async with async_session_maker() as session:
        # Check for non-zero counts
        stmt = select(func.count(Partner.id)).where(Partner.referral_count > 0)
        non_zero_referrals = (await session.execute(stmt)).scalar() or 0
        
        stmt_earned = select(func.count(Partner.id)).where(Partner.total_earned_usdt > 0)
        non_zero_earned = (await session.execute(stmt_earned)).scalar() or 0
        
        print(f"Users with referral_count > 0: {non_zero_referrals}")
        print(f"Users with total_earned_usdt > 0: {non_zero_earned}")
        
        # Check for any users with depth > 0
        stmt_depth = select(func.count(Partner.id)).where(Partner.depth > 0)
        non_zero_depth = (await session.execute(stmt_depth)).scalar() or 0
        print(f"Users with depth > 0: {non_zero_depth}")

if __name__ == "__main__":
    asyncio.run(verify_stats())
