import asyncio
import os
import sys
import json
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))
sys.path.append(BASE_DIR)

from app.core.config import settings
from app.core.security import validate_telegram_data, get_tg_user
from app.models.partner import Partner
from generate_init_data import generate_init_data
from app.api.endpoints.partner.finance import get_finance_stats

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test_finance_stats():
    token = settings.BOT_TOKEN
    init_data = generate_init_data(716720099, "Grand Maestro", "uslincoln", token)
    user_data = validate_telegram_data(init_data)
    
    async with async_session_maker() as session:
        print("\n--- Calling get_finance_stats ---")
        try:
            res = await get_finance_stats(user_data, session)
            print("✅ get_finance_stats response summary:")
            print(f"Total Earned: {res.get('total_earned')}")
            print(f"Balance: {res.get('balance')}")
            print("Monthly History:")
            print(json.dumps(res.get("monthly_history"), indent=2, default=str))
        except Exception as e:
            print("❌ get_finance_stats failed:", e)

if __name__ == "__main__":
    asyncio.run(test_finance_stats())
