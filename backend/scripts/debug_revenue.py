
import asyncio
import os
import sys

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.partner import get_session
from app.services.admin_service import admin_service
from datetime import datetime
from sqlalchemy import func
from sqlmodel import select
from app.models.transaction import PartnerTransaction

# Only if not set
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def debug_service():
    print("----------------------------------------------------------------")
    print("Debugging AdminService Logic...")
    
    async for session in get_session():
        # 1. Test query directly
        print("1. Testing SQL Query directly...")
        try:
            total_rev = (await session.exec(select(func.sum(PartnerTransaction.amount)).where(PartnerTransaction.status == "completed"))).one() or 0.0
            print(f" -> SQL Total Revenue: {total_rev}")
        except Exception as e:
            print(f" -> SQL Error: {e}")

        # 2. Test Service Method
        print("2. Testing _calculate_financial_metrics...")
        try:
            metrics = await admin_service._calculate_financial_metrics(session)
            print(" -> Metrics Result:", metrics)
        except Exception as e:
            print(f" -> Service Error: {e}")
            import traceback
            traceback.print_exc()

        # 3. Test Full Stats (Force Refresh)
        print("3. Testing get_dashboard_stats(force_refresh=True)...")
        try:
            stats = await admin_service.get_dashboard_stats(force_refresh=True)
            fin = stats.get("financials", {})
            print(f" -> Dashboard Total Revenue: {fin.get('total_revenue')}")
            print(f" -> Dashboard Net Profit: {fin.get('net_profit')}")
        except Exception as e:
            print(f" -> Dashboard Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_service())
