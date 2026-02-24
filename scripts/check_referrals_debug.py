
import asyncio
import sys
import os

# Define base path
BASE_DIR = '/Users/grandmaestro/Developer/P2PHub'
sys.path.append(os.path.join(BASE_DIR, 'backend'))

# Add the vendor directory if needed, but we use PYTHONPATH instead
# sys.path.append('/Users/grandmaestro/Developer/P2PHub/.venv/lib/python3.13/site-packages')

from sqlmodel import select, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models.partner import Partner
from app.services.analytics_service import get_referral_tree_stats

DATABASE_URL = 'postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway'
engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_stats(username: str):
    async with async_session_maker() as session:
        # Find user
        stmt = select(Partner).where(Partner.username == username)
        res = await session.exec(stmt)
        user = res.first()
        
        if not user:
            # Try case-insensitive
            stmt = select(Partner).where(Partner.username.ilike(username))
            res = await session.exec(stmt)
            user = res.first()
            
        if not user:
            print(f'❌ User @{username} not found')
            return

        print(f'✅ Found User: @{user.username} (ID: {user.id})')
        print(f'   Materialized referral_count field (L1): {user.referral_count}')
        
        # Count actual L1 referrals
        stmt_l1 = select(Partner).where(Partner.referrer_id == user.id)
        res_l1 = await session.exec(stmt_l1)
        l1_partners = res_l1.all()
        actual_l1 = len(l1_partners)
        print(f'   Actual L1 referral count: {actual_l1}')
        
        # Count total network size (all versions of path containing user.id)
        stmt_total = select(Partner).where(
            (Partner.path.like(f'%.{user.id}.%')) | 
            (Partner.path.like(f'{user.id}.%')) | 
            (Partner.path.like(f'%.{user.id}')) | 
            (Partner.referrer_id == user.id)
        )
        res_total = await session.exec(stmt_total)
        total_partners = res_total.all()
        total_network = len(total_partners)
        print(f'   Actual Total Network size (SQL): {total_network}')
        
        # Also check referral tree stats (20 levels)
        tree_stats = await get_referral_tree_stats(session, user.id)
        api_total = sum(tree_stats.values())
        print(f'   API Computed Total (20 levels): {api_total}')
        print(f'   Tree Stats: {tree_stats}')
        
        if api_total == 188:
            print(f'🚀 MATCH! @{user.username} has 188 total members.')
        else:
            print(f'❌ NO MATCH! User showed 188, but DB says {api_total}.')

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'USLINCOLN'
    asyncio.run(check_stats(target))
