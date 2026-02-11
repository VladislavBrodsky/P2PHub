
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

# Manual connection string from .env.backend
# Note: Using the PUBLIC URL and converting to asyncpg if needed
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def check_db():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.begin() as conn:
            print("✅ Connection successful!")
            
            # Check tables
            print("\nChecking tables...")
            result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result.fetchall()]
            print(f"Tables found: {', '.join(tables)}")
            
            if 'partner' in tables:
                print("\nChecking 'partner' table columns...")
                result = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'partner'"))
                columns = {row[0]: row[1] for row in result.fetchall()}
                for col, dtype in columns.items():
                    print(f"  - {col}: {dtype}")
                
                required_cols = ['pro_notification_seen', 'total_earned_usdt', 'referral_count']
                for col in required_cols:
                    if col in columns:
                        print(f"✅ Column '{col}' exists.")
                    else:
                        print(f"❌ Column '{col}' IS MISSING!")
            else:
                print("❌ 'partner' table NOT FOUND!")

            if 'alembic_version' in tables:
                print("\nChecking alembic version...")
                result = await conn.execute(text("SELECT version_num FROM alembic_version"))
                version = result.scalar()
                print(f"Current migration version: {version}")

    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
