
import asyncio
import sys
import os

# Set backend in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func

# Local fallback for the model if needed, but we'll try to import
try:
    from app.models.partner import Partner
except ImportError:
    print("❌ Failed to import Partner model from app.models.partner")
    sys.exit(1)

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
        stmt_l1 = select(func.count(Partner.id)).where(Partner.referrer_id == user.id)
        res_l1 = await session.exec(stmt_l1)
        actual_l1 = res_l1.one()
        print(f'   Actual L1 referral count: {actual_l1}')
        
        # Fast tree stats using Materialized Path (like in analytics_service)
        # We'll use text() to avoid any SQLModel mapping issues for this complex check
        search_path = f"{user.path or ''}.{user.id}".lstrip(".")
        base_depth = len(search_path.split('.'))
        
        query = text("""
            SELECT depth - :base_depth + 1 as level, COUNT(*) as count
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            AND (depth - :base_depth + 1) BETWEEN 1 AND 20
            GROUP BY 1
            ORDER BY level;
        """)

        result = await session.execute(query, {
            "search_path": search_path,
            "search_wildcard": f"{search_path}.%",
            "base_depth": base_depth
        })
        
        tree_counts = {i: 0 for i in range(1, 21)}
        for row in result.all():
            lvl = int(row[0])
            if 1 <= lvl <= 20:
                tree_counts[lvl] = row[1]
                
        total_network = sum(tree_counts.values())
        print(f'   Full Network Stats (20 levels):')
        for lvl, count in tree_counts.items():
            if count > 0 or lvl <= 3:
                print(f'      L{lvl}: {count}')
        
        print(f'   Actual Total Network size (L1-L20): {total_network}')
        
        if total_network == 188:
            print(f'🚀 MATCH! @{user.username} has exactly 188 total members in their network.')
        elif user.referral_count == 188:
            print(f'🚀 MATCH! @{user.username} has exactly 188 direct (L1) referrals matching the UI.')
        else:
            print(f'📊 No 188 match found. L1={user.referral_count}, L1_actual={actual_l1}, Total={total_network}')

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'USLINCOLN'
    asyncio.run(check_stats(target))
