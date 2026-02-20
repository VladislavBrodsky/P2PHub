import asyncio
import logging
from datetime import UTC, datetime, timedelta
from typing import Any
from sqlmodel import select
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

viral_analytics = ViralAnalyticsService()
