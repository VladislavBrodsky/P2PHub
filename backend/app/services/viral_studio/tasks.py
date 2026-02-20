from app.core.broker import broker
from .studio import viral_studio
from .logging import viral_logger

@broker.task(task_name="log_viral_generation_task")
async def log_viral_generation_task(
    partner_id: int,
    topic: str,
    audience: str,
    language: str,
    openai_prompt: str,
    gemini_prompt: str,
    duration: float,
    tokens_openai: int,
    tokens_gemini: int,
    title: str,
    body: str,
    image_url: str | None
):
    """Background task to log viral content generation to Google Sheets."""
    from sqlalchemy.orm import sessionmaker
    from sqlmodel.ext.asyncio.session import AsyncSession
    from app.models.partner import Partner, engine
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        partner = await session.get(Partner, partner_id)
        if not partner:
            return
            
        await viral_logger.log_generation_to_sheets(
            partner=partner,
            topic=topic,
            audience=audience,
            language=language,
            openai_prompt=openai_prompt,
            gemini_prompt=gemini_prompt,
            duration=duration,
            tokens_openai=tokens_openai,
            tokens_gemini=tokens_gemini,
            title=title,
            body=body,
            image_url=image_url
        )

@broker.task(task_name="log_rss_to_sheets_task")
async def log_rss_to_sheets_task(news_items: list[dict]):
    """Background task to log RSS news items to Google Sheets."""
    await viral_logger.log_rss_to_sheets(news_items)
