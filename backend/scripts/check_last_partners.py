import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def check():
    db_url = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT COUNT(*) FROM partner"))
        print(f"TOTAL_PARTNERS: {res.scalar()}")
        
        res2 = await conn.execute(text("SELECT id, username, first_name, created_at FROM partner ORDER BY created_at DESC LIMIT 5"))
        print("\nLAST 5 PARTNERS:")
        for row in res2:
            print(row)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
