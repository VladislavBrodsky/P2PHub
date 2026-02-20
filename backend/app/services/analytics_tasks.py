import logging

from app.core.broker import broker

logger = logging.getLogger(__name__)

@broker.task(task_name="update_active_posts_metrics_task", schedule=[{"cron": "*/30 * * * *"}]) # Every 30 minutes
async def update_active_posts_metrics_task():
    """
    Background worker that updates metrics for all active social posts from last 7 days.
    """
    from sqlalchemy.orm import sessionmaker
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.models.partner import engine
    from app.services.viral_analytics_service import viral_analytics
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        logger.info("📊 Starting periodic post metrics refresh...")
        try:
            await viral_analytics.update_all_post_metrics(session)
            logger.info("✅ Post metrics refresh complete.")
        except Exception as e:
            logger.error(f"❌ Metrics refresh failed: {e}")
