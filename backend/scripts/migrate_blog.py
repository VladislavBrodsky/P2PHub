import asyncio
import json
import os
import secrets
import sys
from datetime import datetime

from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend to path to import app and scripts/data
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import re

from data.blog_content_en import BLOG_CONTENT_EN
from data.blog_content_ru import BLOG_CONTENT_RU

from app.models.blog import BlogPost, BlogPostEngagement
from app.models.partner import async_session_maker, engine, get_session

# Hardcoded blog post slugs and basic info
BLOG_POSTS_INFO = [
    {"slug": str(i), "category": "Wealth Strategy", "author": "Pinto Team"}
    for i in range(1, 51) # Support up to 50 articles
]
# Overwrite specific authors/categories if needed for original 19
ORIGINAL_INFO = [
    {"slug": "2", "category": "Financial Shift", "author": "Alex Rivera"},
    {"slug": "3", "category": "Growth Mindset", "author": "Sarah Chen"},
    {"slug": "5", "category": "Financial Evolution", "author": "Alex Rivera"},
    {"slug": "6", "category": "Banking Reform", "author": "Sarah Chen"},
    {"slug": "8", "category": "Web3", "author": "Alex Rivera"},
    {"slug": "10", "category": "Global Impact", "author": "Sarah Chen"},
    {"slug": "11", "category": "Innovation", "author": "Alex Rivera"},
    {"slug": "13", "category": "Future", "author": "Sarah Chen"},
    {"slug": "14", "category": "Payments", "author": "Alex Rivera"},
    {"slug": "16", "category": "Partnership", "author": "Sarah Chen"},
    {"slug": "17", "category": "Income", "author": "Alex Rivera"},
    {"slug": "19", "category": "Vision", "author": "Sarah Chen"},
]
# Merge original info
for item in ORIGINAL_INFO:
    for base in BLOG_POSTS_INFO:
        if base["slug"] == item["slug"]:
            base.update(item)

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def migrate():
    print("Creating tables...")
    await create_tables()

    # Load locales
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    try:
        with open(os.path.join(base_path, "frontend/src/locales/en/marketing.json")) as f:
            en = json.load(f)
        with open(os.path.join(base_path, "frontend/src/locales/ru/marketing.json")) as f:
            ru = json.load(f)
    except FileNotFoundError:
        print("Locale files not found, using empty dicts for metadata")
        en = {"blog": {"posts": {}}}
        ru = {"blog": {"posts": {}}}

    en_posts = en.get("blog", {}).get("posts", {})
    ru_posts = ru.get("blog", {}).get("posts", {})

    # Sync any missing metadata from contents to locales first
    for slug in BLOG_CONTENT_EN:
        if int(slug) < 20: continue
        if slug not in en_posts:
            # Try to extract title/excerpt
            text = BLOG_CONTENT_EN[slug]
            title_match = re.search(r'# (.*?)\n', text)
            excerpt_match = re.search(r'\n\n(.*?)\n\n', text)
            if title_match:
                en_posts[slug] = {
                    "title": title_match.group(1).strip(),
                    "excerpt": excerpt_match.group(1).strip() if excerpt_match else "",
                    "category": "Intelligence Hub" # Default, will be updated by loop
                }
    
    for slug in BLOG_CONTENT_RU:
        if int(slug) < 20: continue
        if slug not in ru_posts:
            text = BLOG_CONTENT_RU[slug]
            title_match = re.search(r'# (.*?)\n', text)
            excerpt_match = re.search(r'\n\n(.*?)\n\n', text)
            if title_match:
                ru_posts[slug] = {
                    "title": title_match.group(1).strip(),
                    "excerpt": excerpt_match.group(1).strip() if excerpt_match else "",
                    "category": "Intelligence Hub"
                }

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
