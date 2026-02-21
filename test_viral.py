import asyncio
import os
import sys

# add path
sys.path.insert(0, '/Users/grandmaestro/Documents/P2PHub/backend')

from app.services.viral_studio.studio import viral_studio
import logging

logging.basicConfig(level=logging.DEBUG)

async def test():
    class DummyPartner:
        id = 123
        is_pro = True
        subscription_plan = "PRO_PLUS_MONTHLY"
        referral_code = "xyz"
        
    partner = DummyPartner()
    
    # Try just image gen
    print("Testing generate_image")
    prompt = "A futuristic neon city"
    url = await viral_studio._generate_image(prompt, partner.id, turbo_mode=True)
    print(f"Image generation returned: {url}")

if __name__ == "__main__":
    asyncio.run(test())
