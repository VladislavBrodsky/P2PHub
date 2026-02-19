
import asyncio
import os
import sys

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.admin_service import admin_service

# Only if not set
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def test_refresh():
    print("Testing get_dashboard_stats(force_refresh=True)...")
    res = await admin_service.get_dashboard_stats(force_refresh=True)
    print("Dashboard Stats (Financials):", res.get("financials"))

if __name__ == "__main__":
    asyncio.run(test_refresh())
