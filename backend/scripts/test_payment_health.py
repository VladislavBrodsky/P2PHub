import asyncio
import logging
import sys
import os
from fastapi import Response

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.endpoints.health import payment_health_check

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_health():
    logger.info("🏥 Testing /payment-health endpoint logic...")
    
    mock_response = Response()
    try:
        result = await payment_health_check(mock_response)
        logger.info(f"✅ Result: {result}")
        
        if result["status"] == "healthy" and result["ton_api"] == "connected":
            logger.info("✅ Payment System is HEALTHY")
        else:
            logger.warning(f"⚠️ Payment System Unhealthy: {result}")
            
    except Exception as e:
        logger.error(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_health())
