import asyncio

from dotenv import load_dotenv

load_dotenv()

import logging

from app.services.viral_studio.studio import viral_studio

logging.basicConfig(level=logging.INFO)

async def test():
    class Partner:
        id = 999
        is_pro = True
        subscription_plan = "PRO_PLUS_MONTHLY"
    partner = Partner()
    
    # disable google to force openai fallback
    viral_studio.genai_client = None
    
    prompt = "Test fallback image logic"
    print("Generating image with OpenAI Fallback...")
    url = await viral_studio._generate_image(prompt, partner.id, turbo_mode=True)
    print(f"URL: {url}")
    print(f"Model used: {getattr(viral_studio, '_last_used_image_model', 'unknown')}")

test_coro = test()
asyncio.run(test_coro)
