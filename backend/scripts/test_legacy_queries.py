import asyncio
from sqlalchemy import text
from app.models.partner import engine

async def test_legacy_queries():
    queries = [
        "SELECT id, telegram_id, username, is_test, created_at, plan, level FROM partner WHERE id IS NOT NULL LIMIT 1",
        "SELECT id, telegram_id, xp, level, is_pro, is_pro_plus, pro_tokens FROM partners WHERE xp >= 0 ORDER BY xp DESC LIMIT 1"
    ]
    
    async with engine.connect() as conn:
        for query in queries:
            try:
                print(f"Running query: {query}")
                result = await conn.execute(text(query))
                row = result.fetchone()
                print(f"✅ Success! Row: {row}")
            except Exception as e:
                print(f"❌ Failed query: {query}")
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_legacy_queries())
