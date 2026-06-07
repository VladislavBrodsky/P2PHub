import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from sqlmodel import select, text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_db_stats():
    async with async_session_maker() as session:
        try:
            # 1. Check current connection count
            conn_query = text("SELECT count(*) FROM pg_stat_activity")
            res_conn = await session.execute(conn_query)
            conn_count = res_conn.scalar()
            print(f"📊 Active DB Connections: {conn_count}")
            
            # 2. Check max connections allowed
            max_query = text("SHOW max_connections")
            res_max = await session.execute(max_query)
            max_conn = res_max.scalar()
            print(f"📊 Max Allowed DB Connections: {max_conn}")
            
            # 3. Check what queries are running
            activity_query = text("SELECT pid, state, query, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state != 'idle' LIMIT 10")
            res_act = await session.execute(activity_query)
            print("\n🔥 Currently Running Queries:")
            for row in res_act.all():
                print(f"PID: {row[0]} | State: {row[1]} | Age: {row[3]} | Query: {row[2][:80]}")
                
        except Exception as e:
            print(f"❌ DB Check failed: {e}", file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(check_db_stats())
