import asyncio
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import Partner, get_session
from app.services.leaderboard_service import leaderboard_service
from sqlmodel import select

async def warmup():
    print("--- STARTING LEADERBOARD WARMUP ---")
    try:
        async for session in get_session():
            stmt = select(Partner).where(Partner.xp > 0)
            res = await session.exec(stmt)
            partners = res.all()
            print(f'Syncing {len(partners)} partners to Redis leaderboard...')
            for p in partners:
                # Use the service directly to ensure XP is synchronized
                await leaderboard_service.update_score(p.id, p.xp)
            print('--- WARMUP SUCCESSFUL ---')
            break
    except Exception as e:
        print(f"❌ WARMUP FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(warmup())
