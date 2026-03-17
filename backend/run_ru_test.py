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
    
    prompt = "сохранять спокойствие и работать усердно дальше в неоновом городе киберпанк"
    print("Generating image in Russian...")
    url = await viral_studio._generate_image(prompt, partner.id, turbo_mode=True)
    print(f"URL: {url}")
    print(f"Model used: {getattr(viral_studio, '_last_used_image_model', 'unknown')}")

asyncio.run(test())
