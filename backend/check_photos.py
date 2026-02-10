
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def check_photo_urls():
    database_url = settings.DATABASE_URL
    if database_url:
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    print(f"Checking partner photo URLs...")
    engine = create_async_engine(database_url)
    
    async with engine.connect() as conn:
        # Check recent partners
        result = await conn.execute(text("""
            SELECT id, first_name, username, photo_url, created_at 
            FROM partner 
            ORDER BY created_at DESC 
            LIMIT 10
        """))
        
        partners = result.fetchall()
        print(f"\n📊 Recent 10 Partners:")
        print("-" * 100)
        for p in partners:
            photo_status = "✅ Local" if p[3] and p[3].startswith("/images/") else ("🔗 Telegram URL" if p[3] else "❌ No photo")
            print(f"ID: {p[0]:5} | Name: {p[1]:15} | Photo: {photo_status:20} | URL: {p[3][:60] if p[3] else 'None'}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_photo_urls())
