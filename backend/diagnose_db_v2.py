
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys

# Manual connection string from .env.backend
# Note: Using the PUBLIC URL and converting to asyncpg if needed
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def check_db():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL, connect_args={"command_timeout": 5})
    try:
        async with asyncio.timeout(10.0):
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
                else:
                    print("❌ 'partner' table NOT FOUND!")

    except asyncio.TimeoutError:
        print("❌ Database connection timed out after 10 seconds.")
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())
