import asyncio

from sqlalchemy import inspect

from app.models.partner import engine


async def main():
    async with engine.connect() as conn:
        cols = await conn.run_sync(lambda sync_conn: inspect(sync_conn).get_columns('notificationretry'))
        print(f"Columns in 'notificationretry': {[c['name'] for c in cols]}")

if __name__ == "__main__":
    asyncio.run(main())
