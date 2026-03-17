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
    
    print("Generating full content...")
    result = await viral_studio.generate_viral_content(
        partner=partner,
        post_type="informative",
        target_audience="beginners",
        language="English"
    )
    print(f"Result Image URL: {result.get('image_url')}")
    print(f"Full status: {result.get('status')}")

asyncio.run(test())
