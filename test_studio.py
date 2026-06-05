import asyncio
import os
import sys

# Set up paths
backend_path = os.path.join(os.getcwd(), 'backend')
sys.path.append(backend_path)

# Load env before anything else
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_path, '.env'))

from app.services.viral_studio import viral_studio
from app.models.partner import Partner

async def test_generation():
    print("🚀 Starting test generation...")
    
    # Force re-init if clients are missing
    if not viral_studio.openai_client and not viral_studio.genai_client:
        print("⚠️ Clients missing, re-initializing...")
        from app.core.config import settings
        # Manual check
        print(f"DEBUG Settings.OPENAI_API_KEY: {bool(settings.OPENAI_API_KEY)}")
        viral_studio._ensure_clients()

    print(f"DEBUG: OpenAI Client: {bool(viral_studio.openai_client)}")
    print(f"DEBUG: Google Client: {bool(viral_studio.genai_client)}")

    if not viral_studio.openai_client and not viral_studio.genai_client:
        print("❌ Still no clients. Exiting.")
        return

    # Mock partner
    partner = Partner(
        id=1,
        telegram_id="123456789",
        subscription_plan="PRO_PLUS_MONTHLY",
        is_pro=True,
        pro_tokens=100
    )
    
    try:
        # We wrap in a shorter timeout to see if it even finishes in 30s
        result = await asyncio.wait_for(
            viral_studio.generate_viral_content(
                partner=partner,
                post_type="Expert Leadership",
                target_audience="Crypto Professionals",
                language="English",
                tone_of_voice="authoritative",
                referral_link="https://t.me/pintopaybot?start=test",
                session=None
            ),
            timeout=45.0
        )
        print("✅ Generation Result:")
        print(f"Status: {result.get('status')}")
        if 'error' in result:
            print(f"Error: {result.get('error')}")
        else:
            print(f"Title: {result.get('title')}")
            print(f"Duration: {result.get('duration')}s")
            print(f"Text Model: {result.get('text_model')}")
            print(f"Image Model: {result.get('image_model')}")
    except asyncio.TimeoutError:
        print("❌ TEST TIMEOUT: Generation took > 45 seconds!")
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_generation())
