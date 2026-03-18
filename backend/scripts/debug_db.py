import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import os
import sys

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend to path

from app.models.blog import BlogPost
from app.models.partner import async_session_maker


async def check_db():
    async with async_session_maker() as session:
        # Count blog posts
        statement = select(func.count()).select_from(BlogPost)
        result = await session.exec(statement)
        count = result.one()
        
        # Get latest 5 slugs
        statement = select(BlogPost.slug).order_by(BlogPost.slug.desc()).limit(5)
        slugs = (await session.exec(statement)).all()
        
        print("--- Database Verification ---")
        print(f"Total Blog Posts in Table: {count}")
        print(f"Latest Slugs: {slugs}")
        print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")

if __name__ == "__main__":
    asyncio.run(check_db())
