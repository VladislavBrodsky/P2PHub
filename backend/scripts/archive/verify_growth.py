import asyncio
import os
import sys

from sqlmodel import select

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner, engine
from app.services.partner_service import (
    get_network_growth_metrics,
    get_network_time_series,
)


async def verify_growth(tg_id: str):
    async with AsyncSession(engine) as session:
        # 1. Get User
        stmt = select(Partner).where(Partner.telegram_id == tg_id)
        res = await session.exec(stmt)
        user = res.first()

        if not user:
            print(f"❌ User {tg_id} not found.")
            return

        print(f"✅ User Found: ID={user.id}, TG={user.telegram_id}")

        # 2. Test 7D Growth
        metrics_7d = await get_network_growth_metrics(session, user.id, '7D')
        print(f"📊 7D Metrics: {metrics_7d}")

        # 3. Test 24H Growth
        metrics_24h = await get_network_growth_metrics(session, user.id, '24H')
        print(f"📊 24H Metrics: {metrics_24h}")

        # 4. Test Time Series
        chart_data = await get_network_time_series(session, user.id, '7D')
        print(f"🌲 Chart Data (7D, first 2 points): {chart_data[:2]}")
        print(f"   (total points: {len(chart_data)})")

if __name__ == "__main__":
    # Test for Victor (ID=1)
    asyncio.run(verify_growth("716720099"))
