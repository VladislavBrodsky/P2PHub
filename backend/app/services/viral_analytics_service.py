import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import Any
from sqlmodel import select
from sqlalchemy import func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import SocialPost, SocialPostMetric, Partner
from app.core.config import settings

logger = logging.getLogger(__name__)

class ViralAnalyticsService:
    """
    Handles fetching and storing performance metrics for viral posts
    on X (Twitter), Telegram, and LinkedIn.
    """

    async def update_all_post_metrics(self, session: AsyncSession):
        """
        Iterates through active posts from the last 7 days and updates their metrics.
        """
        seven_days_ago = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
        stmt = select(SocialPost).where(SocialPost.created_at >= seven_days_ago)
        result = await session.exec(stmt)
        posts = result.all()

        for post in posts:
            try:
                metrics = await self.fetch_post_metrics(post, session)
                if metrics:
                    # Save snapshot
                    metric_record = SocialPostMetric(
                        post_id=post.id,
                        views=metrics.get("views", 0),
                        likes=metrics.get("likes", 0),
                        reposts=metrics.get("reposts", 0),
                        replies=metrics.get("replies", 0),
                        engagement_rate=metrics.get("engagement_rate", 0.0)
                    )
                    session.add(metric_record)
                    
                    post.last_metric_check = datetime.now(UTC).replace(tzinfo=None)
                    session.add(post)
                
                await session.commit()
            except Exception as e:
                logger.error(f"Failed to update metrics for post {post.id} ({post.platform}): {e}")

    async def fetch_post_metrics(self, post: SocialPost, session: AsyncSession) -> dict[str, Any] | None:
        """
        Routes to the correct platform fetcher.
        """
        if post.platform == "x":
            return await self._fetch_x_metrics(post, session)
        elif post.platform == "telegram":
            return await self._fetch_telegram_metrics(post)
        return None

    async def _fetch_x_metrics(self, post: SocialPost, session: AsyncSession) -> dict[str, Any] | None:
        """
        Fetches metrics using Twitter API v2.
        """
        partner = await session.get(Partner, post.partner_id)
        if not partner or not partner.x_api_key:
            return None

        try:
            import tweepy
            client = tweepy.Client(
                bearer_token=settings.TWITTER_BEARER_TOKEN, # Or use user keys
                consumer_key=partner.x_api_key,
                consumer_secret=partner.x_api_secret,
                access_token=partner.x_access_token,
                access_token_secret=partner.x_access_token_secret
            )
            
            # Twitter ID must be int for some methods, string for others
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: client.get_tweet(
                    id=post.external_id, 
                    tweet_fields=["public_metrics", "non_public_metrics"]
                )
            )
            
            if response and response.data:
                metrics = response.data.public_metrics
                return {
                    "views": metrics.get("impression_count", 0),
                    "likes": metrics.get("like_count", 0),
                    "reposts": metrics.get("retweet_count", 0),
                    "replies": metrics.get("reply_count", 0),
                    "engagement_rate": 0.0 # Calculate if needed
                }
        except Exception as e:
            logger.debug(f"X metric fetch skipped/failed: {e}")
        return None

    async def _fetch_telegram_metrics(self, post: SocialPost) -> dict[str, Any] | None:
        """
        Fetches Telegram metrics. Note: API restricted for bots.
        We primarily track views if the channel is public or the bot is admin.
        """
        from bot import bot
        try:
            # We can't directly get "likes" on a message via bot API easily 
            # unless we use reactions (which require a separate API call).
            # For now, we'll try to get views if available.
            # Forwarding a message to a dummy channel can sometimes reveal views,
            # but that's messy. Instead, we use the fact that some bots can see it.
            
            # Note: The standard Bot API doesn't provide "views" for a message_id.
            # This would require MTProto (Telegram Client API).
            # For this MVP, we will record 0 views/likes and mark for "Telegram Client Integration"
            return {
                "views": 0,
                "likes": 0,
                "reposts": 0,
                "replies": 0,
                "engagement_rate": 0.0
            }
        except Exception:
            return None

    async def get_partner_stats(self, partner_id: int, session: AsyncSession) -> dict[str, Any]:
        """
        Aggregates stats for the "Viral Analytics Cabinet".
        """
        from sqlalchemy import func
        from app.models.partner import ViralGeneration
        
        # 1. Total Generations
        gen_stmt = select(func.count(ViralGeneration.id)).where(ViralGeneration.partner_id == partner_id)
        total_gens = (await session.exec(gen_stmt)).first() or 0
        
        # 2. Total Posts & Aggregated Metrics
        posts_stmt = select(SocialPost).where(SocialPost.partner_id == partner_id)
        posts = (await session.exec(posts_stmt)).all()
        
        total_views = 0
        total_likes = 0
        total_reposts = 0
        
        post_details = []
        for post in posts:
            # Get latest metrics for each post
            metric_stmt = select(SocialPostMetric).where(SocialPostMetric.post_id == post.id).order_by(SocialPostMetric.timestamp.desc()).limit(1)
            latest_metric = (await session.exec(metric_stmt)).first()
            
            views = latest_metric.views if latest_metric else 0
            likes = latest_metric.likes if latest_metric else 0
            reposts = latest_metric.reposts if latest_metric else 0
            
            total_views += views
            total_likes += likes
            total_reposts += reposts
            
            post_details.append({
                "id": post.id,
                "platform": post.platform,
                "views": views,
                "likes": likes,
                "reposts": reposts,
                "created_at": post.created_at.isoformat()
            })

        return {
            "summary": {
                "total_generations": total_gens,
                "total_posts": len(posts),
                "total_views": total_views,
                "total_likes": total_likes,
                "total_reposts": total_reposts,
                "avg_engagement": (total_likes + total_reposts) / total_views if total_views > 0 else 0
            },
            "posts": post_details[:10] # Last 10 posts
        }

    async def get_predictive_insights(self, partner_id: int, session: AsyncSession) -> dict[str, Any]:
        """
        The "Predictive Resonance" engine.
        Analyzes high-performing posts to suggest optimal hooks/topics.
        """
        # For MVP: Find the top 3 posts by engagement and suggest variants
        from app.models.partner import ViralGeneration
        
        # Joined query to find best generations
        stmt = (
            select(ViralGeneration, func.max(SocialPostMetric.views + SocialPostMetric.likes))
            .join(SocialPost, SocialPost.generation_id == ViralGeneration.id)
            .join(SocialPostMetric, SocialPostMetric.post_id == SocialPost.id)
            .where(ViralGeneration.partner_id == partner_id)
            .group_by(ViralGeneration.id)
            .order_by(func.max(SocialPostMetric.views + SocialPostMetric.likes).desc())
            .limit(3)
        )
        
        results = (await session.exec(stmt)).all()
        
        recommendations = []
        if not results:
            recommendations.append({
                "type": "discovery",
                "headline": "Start with Curiosity Hooks",
                "reason": "New account baseline—curiosity generates 40% more 'Comments' in early stages.",
                "resonance_score": 0.85
            })
        else:
            for gen, score in results:
                recommendations.append({
                    "type": "scaling",
                    "headline": f"Double down on {gen.topic} for {gen.audience}",
                    "reason": f"Your previous post on this topic achieved {score} engagement points. High resonance detected.",
                    "resonance_score": min(0.99, 0.8 + (score / 1000))
                })

        return {
            "resonance_engine_status": "active",
            "next_best_action": recommendations[0] if recommendations else None,
            "top_resonance_segments": recommendations
        }

viral_analytics = ViralAnalyticsService()
