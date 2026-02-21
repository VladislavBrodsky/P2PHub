import asyncio
import logging
import random
from datetime import datetime
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.partner import engine

async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
from app.models.partner import Partner
from app.services.viral_studio.studio import viral_studio
from dotenv import load_dotenv

load_dotenv(".env.backend")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_tests():
    async with async_session() as session:
        # Find user @uslincoln
        from sqlalchemy import select
        stmt = select(Partner).where(Partner.username.ilike("%uslincoln%"))
        result = await session.execute(stmt)
        partner = result.scalars().first()

        if not partner:
            logger.error("User @uslincoln not found!")
            return

        logger.info(f"Found partner: {partner.username} (ID: {partner.id})")

        # 3 Random Combinations
        categories = ["partners", "partners_network", "partners_cards", "revenue", "product_update"]
        audiences = ["growth_masters", "passive_seekers", "nomads", "crypto_natives", "students"]

        test_cases = []
        for _ in range(3):
            test_cases.append({
                "post_type": random.choice(categories),
                "target_audience": random.choice(audiences),
                "language": random.choice(["English", "Russian"]),
                "tone_of_voice": random.choice(["authoritative", "visionary", "analytical"])
            })

        for i, tc in enumerate(test_cases):
            logger.info(f"\n--- Post {i+1} : {tc['post_type']} / {tc['target_audience']} ---")
            
            # Generate content
            res = await viral_studio.generate_viral_content(
                partner=partner,
                post_type=tc["post_type"],
                target_audience=tc["target_audience"],
                language=tc["language"],
                tone_of_voice=tc["tone_of_voice"],
                session=session
            )
            
            if res.get("status") == "failed" or "error" in res:
                logger.error(f"Generation failed: {res}")
                continue
                
            content = res.get("body", "")
            image_path = res.get("image_url")
            
            logger.info(f"Generated title: {res.get('title')}")
            logger.info(f"Image Path: {image_path}")

            # Post to Telegram
            logger.info(f"Posting to Telegram...")
            post_res = await viral_studio.post_to_social(
                partner=partner,
                platform="telegram",
                content=content,
                image_path=image_path,
                session=session
            )
            
            logger.info(f"Post Result: {post_res}")

            if i < 2:
                logger.info("Waiting 60 seconds before next post...")
                await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(run_tests())
