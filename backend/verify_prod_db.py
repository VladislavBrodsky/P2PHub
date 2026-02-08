
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

# Override database URL if needed to ensure we hit production (though .env should handle it)
# settings.DATABASE_URL should already be the production one if running in the right env
print(f"Checking DB: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else '...'}")

async def verify_db():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as conn:
        print("Connected to DB.")
        
        # Check tables
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [row[0] for row in result.fetchall()]
        print(f"Tables found: {tables}")
        
        if 'partner' in tables:
            # Check columns in partner
            result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'partner'"))
            columns = [row[0] for row in result.fetchall()]
            print(f"Columns in 'partner': {columns}")
            
            # Check for essential columns
            essential = ['first_name', 'last_name', 'photo_url', 'telegram_id', 'username']
            missing = [col for col in essential if col not in columns]
            if missing:
                print(f"CRITICAL: Missing columns: {missing}")
            else:
                print("SUCCESS: All essential partner columns present.")
                
            # Count users
            result = await conn.execute(text("SELECT count(*) FROM partner"))
            count = result.scalar()
            print(f"Current partners in DB: {count}")
            
        else:
            print("CRITICAL: 'partner' table missing!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify_db())
