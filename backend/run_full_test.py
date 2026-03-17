import asyncio

from dotenv import load_dotenv

load_dotenv()

import logging

from app.services.viral_studio.studio import viral_studio

logging.basicConfig(level=logging.DEBUG)

async def test():
    class Partner:
        id = 999
        is_pro = True
        subscription_plan = "PRO_PLUS_MONTHLY"
        referral_code = "xyz"
    partner = Partner()
    
    print("Generating full content...")
    result = await viral_studio.generate_viral_content(
        partner=partner,
        post_type="partners",
        target_audience="builders",
        language="Russian"
    )
    print("--- RESULT ---")
    print(f"Title: {result.get('title')}")
    print(f"Image URL: {result.get('image_url')}")
    print(f"Status: {result.get('status')}")

test_coro = test()
asyncio.run(test_coro)
