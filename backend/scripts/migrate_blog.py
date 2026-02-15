import asyncio
import json
import os
import secrets
import sys
from datetime import datetime
from sqlmodel import select, SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend to path to import app and scripts/data
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.blog import BlogPost, BlogPostEngagement
from app.models.partner import get_session, async_session_maker, engine
from data.blog_content_en import BLOG_CONTENT_EN
from data.blog_content_ru import BLOG_CONTENT_RU

# Hardcoded blog post slugs and basic info from frontend/src/data/blogPosts.ts
BLOG_POSTS_INFO = [
    {"slug": "1", "category": "Wealth Strategy", "author": "Pinto Team"},
    {"slug": "2", "category": "Financial Shift", "author": "Alex Rivera"},
    {"slug": "3", "category": "Growth Mindset", "author": "Sarah Chen"},
    {"slug": "4", "category": "Freedom", "author": "Pinto Team"},
    {"slug": "5", "category": "Financial Evolution", "author": "Alex Rivera"},
    {"slug": "6", "category": "Banking Reform", "author": "Sarah Chen"},
    {"slug": "7", "category": "Tech Analysis", "author": "Pinto Team"},
    {"slug": "8", "category": "Web3", "author": "Alex Rivera"},
    {"slug": "9", "category": "Elite Strategy", "author": "Pinto Team"},
    {"slug": "10", "category": "Global Impact", "author": "Sarah Chen"},
    {"slug": "11", "category": "Innovation", "author": "Alex Rivera"},
    {"slug": "12", "category": "Adoption", "author": "Pinto Team"},
    {"slug": "13", "category": "Future", "author": "Sarah Chen"},
    {"slug": "14", "category": "Payments", "author": "Alex Rivera"},
    {"slug": "15", "category": "Wealth", "author": "Pinto Team"},
    {"slug": "16", "category": "Partnership", "author": "Sarah Chen"},
    {"slug": "17", "category": "Income", "author": "Alex Rivera"},
    {"slug": "18", "category": "PRO Benefits", "author": "Pinto Team"},
    {"slug": "19", "category": "Vision", "author": "Sarah Chen"},
]

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def migrate():
    print("Creating tables...")
    await create_tables()

    # Load locales
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    try:
        with open(os.path.join(base_path, "frontend/src/locales/en.json"), "r") as f:
            en = json.load(f)
        with open(os.path.join(base_path, "frontend/src/locales/ru.json"), "r") as f:
            ru = json.load(f)
    except FileNotFoundError:
        print("Locale files not found, using empty dicts for metadata")
        en = {"blog": {"posts": {}}}
        ru = {"blog": {"posts": {}}}

    en_posts = en.get("blog", {}).get("posts", {})
    ru_posts = ru.get("blog", {}).get("posts", {})

    async with async_session_maker() as session:
        for info in BLOG_POSTS_INFO:
            slug = info["slug"]
            
            # check if title exists in locales, otherwise fallback to info
            en_p = en_posts.get(slug, {})
            ru_p = ru_posts.get(slug, {})
            
            content_en = BLOG_CONTENT_EN.get(slug, "")
            content_ru = BLOG_CONTENT_RU.get(slug, "")
            
            # Check if exists
            stmt = select(BlogPost).where(BlogPost.slug == slug)
            existing = (await session.exec(stmt)).first()
            
            if existing:
                print(f"Updating {slug} content...")
                existing.content_en = content_en
                existing.content_ru = content_ru
                # Update metadata if available
                if en_p.get("title"): existing.title_en = en_p.get("title")
                if ru_p.get("title"): existing.title_ru = ru_p.get("title")
                if en_p.get("excerpt"): existing.excerpt_en = en_p.get("excerpt")
                if ru_p.get("excerpt"): existing.excerpt_ru = ru_p.get("excerpt")
                if en_p.get("category"): existing.category = en_p.get("category")
                
                session.add(existing)
            else:
                print(f"Creating new post {slug}...")
                post = BlogPost(
                    slug=slug,
                    title_en=en_p.get("title", f"Blog Post {slug}"),
                    title_ru=ru_p.get("title", f"Блог Пост {slug}"),
                    excerpt_en=en_p.get("excerpt", ""),
                    excerpt_ru=ru_p.get("excerpt", ""),
                    content_en=content_en,
                    content_ru=content_ru,
                    category=en_p.get("category", info["category"]),
                    author=info["author"],
                    is_published=True,
                    published_at=datetime.utcnow()
                )
                session.add(post)
            
            # Engagement
            e_stmt = select(BlogPostEngagement).where(BlogPostEngagement.post_slug == slug)
            existing_e = (await session.exec(e_stmt)).first()
            if not existing_e:
                engagement = BlogPostEngagement(
                    post_slug=slug,
                    base_likes=333 + secrets.randbelow(380)
                )
                session.add(engagement)
        
        await session.commit()
        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
