import asyncio
from sqlalchemy import inspect
from app.models.partner import engine

async def main():
    async with engine.connect() as conn:
        tables = await conn.run_sync(lambda sync_conn: inspect(sync_conn).get_table_names())
        print(f"Tables in DB: {tables}")
        if "notificationretry" in tables:
            print("✅ 'notificationretry' already exists in the database.")
        else:
            print("❌ 'notificationretry' does NOT exist in the database.")

if __name__ == "__main__":
    asyncio.run(main())
