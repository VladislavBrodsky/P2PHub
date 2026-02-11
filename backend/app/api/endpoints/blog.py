import random

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import get_current_user, get_tg_user
from app.models.blog import BlogPostEngagement, PartnerBlogLike
from app.models.partner import Partner, get_session

router = APIRouter()

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
        fb_likes = random.randint(333, 712)
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
        raise HTTPException(status_code=404, detail="Partner not found")

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
            base_likes=random.randint(333, 712),
            user_likes=1
        )
    else:
        engagement.user_likes += 1

    session.add(engagement)
    await session.commit()

    return {"status": "ok", "likes": engagement.base_likes + engagement.user_likes}
