
import asyncio
import logging
from sqlmodel import select
from app.models.partner import Partner, engine, get_session
from app.services.partner_service import migrate_paths
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_fix():
    logger.info("Starting path and depth fix script...")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # Check if depth exists (it should if we added it to model)
        # We'll just run migrate_paths which we updated
        await migrate_paths(session)
        logger.info("Successfully fixed paths and depths for all partners.")

if __name__ == "__main__":
    asyncio.run(run_fix())
