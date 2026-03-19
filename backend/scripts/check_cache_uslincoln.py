import asyncio
import json
import logging
from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_cache():
    test_tg_id = "716720099" # uslincoln
    v5_key = f"partner:profile:v5:{test_tg_id}"
    
    logger.info(f"Checking Cache for {test_tg_id}...")
    
    raw_data = await redis_service.client.get(v5_key)
    if raw_data:
        logger.info("Raw Cache Data FOUND")
        try:
            data = json.loads(raw_data)
            logger.info(f"JSON Data: {json.dumps(data, indent=2)}")
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
    else:
        logger.info("Cache Data NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check_cache())
