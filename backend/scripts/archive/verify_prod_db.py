
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text, inspect
from dotenv import load_dotenv

# Force load the .env file
load_dotenv(dotenv_path=".env")

# Get the URL directly
url = os.getenv("DATABASE_URL")
if not url:
    print("❌ DATABASE_URL not set")
    import sys
    sys.exit(1)

print("Connecting to database from environment...")

async def verify():
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        print("Connected.")
        
        # Check alembic version
        result = await conn.execute(text("SELECT * FROM alembic_version"))
        version = result.scalar()
        print(f"Current Alembic Version: {version}")

        # Check columns
        print("Checking columns in 'partner' table...")
        # Note: inspect is synchronous, so we run it in a sync context or use text queries for async
        
        # Using raw SQL to be safe in async
        result = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'partner';
        """))
        
        columns = result.fetchall()
        found_checkin = False
        found_streak = False
        
        print("\nColumns found:")
        for col in columns:
            print(f"- {col[0]} ({col[1]})")
            if col[0] == 'last_checkin_at':
                found_checkin = True
            if col[0] == 'checkin_streak':
                found_streak = True
        
        print("-" * 20)
        if found_checkin and found_streak:
            print("✅ SUCCESS: Both columns exist in the database.")
        else:
            print("❌ FAILURE: Missing columns.")
            if not found_checkin: print(" - Missing: last_checkin_at")
            if not found_streak: print(" - Missing: checkin_streak")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify())
