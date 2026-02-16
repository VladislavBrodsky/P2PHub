import re
import json
import os
import asyncio
import secrets
import sys
from datetime import datetime
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

# Setup Paths
base_dir = '/Users/grandmaestro/Documents/P2PHub'
sys.path.append(os.path.join(base_dir, 'backend'))
sys.path.append(os.path.join(base_dir, 'backend/scripts'))

from data.blog_content_en import BLOG_CONTENT_EN
from data.blog_content_ru import BLOG_CONTENT_RU
from app.models.blog import BlogPost, BlogPostEngagement
from app.models.partner import async_session_maker, engine

def sync_locales():
    for lang in ['en', 'ru']:
        content_path = os.path.join(base_dir, f'backend/scripts/data/blog_content_{lang}.py')
        json_path = os.path.join(base_dir, f'frontend/src/locales/{lang}/marketing.json')
        
        if not os.path.exists(content_path): continue

        with open(content_path, 'r', encoding='utf-8') as f:
            py_content = f.read()

        articles = {}
        pattern = r'"(\d+)":\s*"""(.*?)"""'
        matches = re.finditer(pattern, py_content, re.DOTALL)

        for match in matches:
            slug = match.group(1)
            text = match.group(2).strip()
            title_match = re.search(r'^#\s+(.*)', text)
            title = title_match.group(1).strip() if title_match else f"Article {slug}"
            
            excerpt = ""
            lines = text.split('\n')
            found_title = False
            for line in lines:
                line = line.strip()
                if not line: continue
                if not found_title:
                    if title in line or line.startswith('#'):
                        found_title = True
                        continue
                if found_title and line:
                    if not line.startswith('###') and not line.startswith('**'):
                        excerpt = line
                        if len(excerpt) > 200: excerpt = excerpt[:197] + "..."
                        break
            
            if not excerpt:
                clean_text = re.sub(r'#+\s.*', '', text)
                clean_text = clean_text.strip()
                excerpt = clean_text.split('\n')[0].strip()[:150]

            articles[slug] = {"title": title, "excerpt": excerpt}

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        posts = data.get('blog', {}).get('posts', {})
        for slug, info in articles.items():
            if slug in posts:
                posts[slug]['title'] = info['title']
                posts[slug]['excerpt'] = info['excerpt']
            else:
                posts[slug] = {"title": info['title'], "excerpt": info['excerpt'], "category": "Intelligence Hub"}

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Synced {lang} locales")

async def migrate_to_db():
    print("Migrating to Database...")
    async with async_session_maker() as session:
        # Get metadata from locales
        with open(os.path.join(base_dir, "frontend/src/locales/ru/marketing.json")) as f:
            ru_meta = json.load(f).get("blog", {}).get("posts", {})
        with open(os.path.join(base_dir, "frontend/src/locales/en/marketing.json")) as f:
            en_meta = json.load(f).get("blog", {}).get("posts", {})

        all_slugs = set(list(BLOG_CONTENT_EN.keys()) + list(BLOG_CONTENT_RU.keys()))
        
        for slug in all_slugs:
            stmt = select(BlogPost).where(BlogPost.slug == slug)
            existing = (await session.exec(stmt)).first()
            
            meta_ru = ru_meta.get(slug, {})
            meta_en = en_meta.get(slug, {})
            
            if existing:
                existing.content_en = BLOG_CONTENT_EN.get(slug, "")
                existing.content_ru = BLOG_CONTENT_RU.get(slug, "")
                existing.title_en = meta_en.get("title", existing.title_en)
                existing.title_ru = meta_ru.get("title", existing.title_ru)
                existing.excerpt_en = meta_en.get("excerpt", existing.excerpt_en)
                existing.excerpt_ru = meta_ru.get("excerpt", existing.excerpt_ru)
                session.add(existing)
            else:
                post = BlogPost(
                    slug=slug,
                    title_en=meta_en.get("title", f"Article {slug}"),
                    title_ru=meta_ru.get("title", f"Статья {slug}"),
                    excerpt_en=meta_en.get("excerpt", ""),
                    excerpt_ru=meta_ru.get("excerpt", ""),
                    content_en=BLOG_CONTENT_EN.get(slug, ""),
                    content_ru=BLOG_CONTENT_RU.get(slug, ""),
                    category=meta_ru.get("category", "Intelligence Hub"),
                    author="Pinto Team",
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
    print("Database Migration Complete")

if __name__ == "__main__":
    sync_locales()
    asyncio.run(migrate_to_db())
