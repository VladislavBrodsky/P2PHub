
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.partner import engine
from sqlalchemy import text

async def alter_db():
    async with engine.begin() as conn:
        print("Altering notificationretry table...")
        await conn.execute(text("ALTER TABLE notificationretry ALTER COLUMN chat_id TYPE VARCHAR(255) USING chat_id::VARCHAR(255);"))
        print("Success!")

if __name__ == "__main__":
    asyncio.run(alter_db())
