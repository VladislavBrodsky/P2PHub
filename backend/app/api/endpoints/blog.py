import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func, or_
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user, get_tg_user
from app.models.blog import BlogPost, BlogPostEngagement, PartnerBlogLike
from app.models.partner import Partner, get_session
from app.schemas.blog import BlogListResponse, BlogPostRead, BlogPostDetail

router = APIRouter()

@router.get("/", response_model=BlogListResponse)
async def list_posts(
    offset: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    q: Optional[str] = None,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List blog posts with pagination, search and filtering."""
    tg_user = get_tg_user(user_data)
    lang = tg_user.get("language_code", "en")
    
    # Base query
    statement = select(BlogPost).where(BlogPost.is_published == True)
    
    if category and category != 'All':
        statement = statement.where(BlogPost.category == category)
        
    if q:
        search = f"%{q}%"
        if lang == 'ru':
            statement = statement.where(or_(BlogPost.title_ru.ilike(search), BlogPost.excerpt_ru.ilike(search)))
        else:
            statement = statement.where(or_(BlogPost.title_en.ilike(search), BlogPost.excerpt_en.ilike(search)))
            
    # Count total
    count_statement = select(func.count()).select_from(statement.subquery())
    total = await session.scalar(count_statement) or 0
    
    # Order and paginate
    statement = statement.order_by(BlogPost.published_at.desc()).offset(offset).limit(limit)
    results = await session.exec(statement)
    posts = results.all()
    
    # Get engagement for all posts in one go
    slugs = [p.slug for p in posts]
    e_stmt = select(BlogPostEngagement).where(BlogPostEngagement.post_slug.in_(slugs))
    engagements = {e.post_slug: e for e in (await session.exec(e_stmt)).all()}
    
    # Get user likes
    tg_id = str(tg_user.get("id"))
    p_stmt = select(Partner).where(Partner.telegram_id == tg_id)
    partner = (await session.exec(p_stmt)).first()
    
    user_likes = set()
    if partner:
        l_stmt = select(PartnerBlogLike.post_slug).where(
            PartnerBlogLike.partner_id == partner.id,
            PartnerBlogLike.post_slug.in_(slugs)
        )
        user_likes = set((await session.exec(l_stmt)).all())
    
    items = []
    for p in posts:
        eng = engagements.get(p.slug)
        likes = (eng.base_likes + eng.user_likes) if eng else 0
        
        items.append(BlogPostRead(
            id=p.id,
            slug=p.slug,
            title=p.title_ru if lang == 'ru' and p.title_ru else p.title_en,
            excerpt=p.excerpt_ru if lang == 'ru' and p.excerpt_ru else p.excerpt_en,
            category=p.category,
            author=p.author,
            image_url=p.image_url,
            published_at=p.published_at,
            likes=likes,
            liked=p.slug in user_likes
        ))
        
    return BlogListResponse(
        items=items,
        total=total,
        offset=offset,
        limit=limit
    )

@router.get("/{slug}", response_model=BlogPostDetail)
async def get_post_detail(
    slug: str,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get full details for a specific blog post."""
    tg_user = get_tg_user(user_data)
    lang = tg_user.get("language_code", "en")
    
    statement = select(BlogPost).where(BlogPost.slug == slug, BlogPost.is_published == True)
    post = (await session.exec(statement)).first()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Get engagement
    e_stmt = select(BlogPostEngagement).where(BlogPostEngagement.post_slug == slug)
    engagement = (await session.exec(e_stmt)).first()
    
    likes = 0
    if not engagement:
        likes = 333 + secrets.randbelow(380)
        engagement = BlogPostEngagement(post_slug=slug, base_likes=likes)
        session.add(engagement)
        await session.commit()
    else:
        likes = engagement.base_likes + engagement.user_likes
        
    # Check if user liked
    tg_id = str(tg_user.get("id"))
    p_stmt = select(Partner).where(Partner.telegram_id == tg_id)
    partner = (await session.exec(p_stmt)).first()
    
    liked = False
    if partner:
        l_stmt = select(PartnerBlogLike).where(
            PartnerBlogLike.partner_id == partner.id,
            PartnerBlogLike.post_slug == slug
        )
        liked = (await session.exec(l_stmt)).first() is not None
        
    return BlogPostDetail(
        id=post.id,
        slug=post.slug,
        title=post.title_ru if lang == 'ru' and post.title_ru else post.title_en,
        excerpt=post.excerpt_ru if lang == 'ru' and post.excerpt_ru else post.excerpt_en,
        content=post.content_ru if lang == 'ru' and post.content_ru else post.content_en,
        category=post.category,
        author=post.author,
        image_url=post.image_url,
        published_at=post.published_at,
        likes=likes,
        liked=liked
    )

@router.get("/stats")
async def get_blog_stats(
    session: AsyncSession = Depends(get_session)
):
    """Get total likes for all posts."""
    statement = select(BlogPostEngagement)
    result = await session.exec(statement)
    stats = result.all()

    return {s.post_slug: {"likes": s.base_likes + s.user_likes} for s in stats}

@router.get("/{slug}/engagement")
async def get_post_engagement(
    slug: str,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get engagement stats for a specific post and check if current user liked it."""
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    # Get partner
    p_stmt = select(Partner).where(Partner.telegram_id == tg_id)
    partner = (await session.exec(p_stmt)).first()

    # Get or create engagement
    e_stmt = select(BlogPostEngagement).where(BlogPostEngagement.post_slug == slug)
    engagement = (await session.exec(e_stmt)).first()

    fb_likes = 0
    if not engagement:
        fb_likes = 333 + secrets.randbelow(380) # Range [333, 712]
        engagement = BlogPostEngagement(
            post_slug=slug,
            base_likes=fb_likes
        )
        session.add(engagement)
        await session.commit()
        await session.refresh(engagement)
    else:
        fb_likes = engagement.base_likes + engagement.user_likes

    liked = False
    if partner:
        l_stmt = select(PartnerBlogLike).where(
            PartnerBlogLike.partner_id == partner.id,
            PartnerBlogLike.post_slug == slug
        )
        liked = (await session.exec(l_stmt)).first() is not None

    return {
        "likes": fb_likes,
        "liked": liked
    }

@router.post("/{slug}/like")
async def like_post(
    slug: str,
    user_data: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Add a like to a post."""
    tg_user = get_tg_user(user_data)
    tg_id = str(tg_user.get("id"))

    p_stmt = select(Partner).where(Partner.telegram_id == tg_id)
    partner = (await session.exec(p_stmt)).first()

    if not partner:
        # Lazy creation for Blog interactions (supports Dev mode & new users)
        from app.services.partner_service import create_partner
        partner, _ = await create_partner(
            session=session,
            telegram_id=tg_id,
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name"),
            last_name=tg_user.get("last_name"),
            language_code=tg_user.get("language_code"),
            photo_file_id=None # We don't have this in simple webapp init usually
        )

    # Check if already liked
    l_stmt = select(PartnerBlogLike).where(
        PartnerBlogLike.partner_id == partner.id,
        PartnerBlogLike.post_slug == slug
    )
    existing_like = (await session.exec(l_stmt)).first()

    if existing_like:
        return {"status": "already_liked"}

    # Add like
    new_like = PartnerBlogLike(partner_id=partner.id, post_slug=slug)
    session.add(new_like)

    # Update engagement
    e_stmt = select(BlogPostEngagement).where(BlogPostEngagement.post_slug == slug)
    engagement = (await session.exec(e_stmt)).first()

    if not engagement:
        engagement = BlogPostEngagement(
            post_slug=slug,
            base_likes=333 + secrets.randbelow(380),
            user_likes=1
        )
    else:
        engagement.user_likes += 1

    session.add(engagement)
    await session.commit()

    return {"status": "ok", "likes": engagement.base_likes + engagement.user_likes}
