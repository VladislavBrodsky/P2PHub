import asyncio
import os
import sys

from sqlalchemy import text

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import engine


async def main():
    print("🚀 Adding path column to partner table...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE partner ADD COLUMN path VARCHAR"))
            await conn.execute(text("CREATE INDEX idx_partner_path ON partner (path)"))
            print("✅ Column and Index added successfully!")
        except Exception as e:
            print(f"⚠️ Warning: {e}")

if __name__ == "__main__":
    asyncio.run(main())
