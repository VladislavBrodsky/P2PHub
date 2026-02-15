import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import settings first to see what happens on load
from app.core.config import settings
from app.services.copywriter import copywriter


async def main():
    print("🚀 Debugging Config Loading...")
    
    # Check if key is in settings
    key = settings.OPENAI_API_KEY
    if key:
        print(f"✅ Settings has OPENAI_API_KEY: {key[:5]}...")
    else:
        print("❌ Settings.OPENAI_API_KEY is None/Empty")

    # Check process environment
    env_key = os.environ.get("OPENAI_API_KEY")
    if env_key:
        print(f"✅ os.environ has OPENAI_API_KEY: {env_key[:5]}...")
    else:
        print("❌ os.environ.get('OPENAI_API_KEY') is None")

    # Re-check copywriter status
    if not copywriter.client:
        print("❌ Copywriter client is NOT initialized.")
        # Try manual init if key exists now
        if key:
            print("🔄 Attempting manual re-init with settings key...")
            copywriter.api_key = key
            from openai import AsyncOpenAI
            copywriter.client = AsyncOpenAI(api_key=key)
    
    if copywriter.client:
        print("✅ Copywriter client is READY.")
        try: 
            print("📝 Attempting generation...")
            # article = await copywriter.generate_article("brand_awareness", "Test Topic")
            # print("✅ Generation success (mock)")
        except Exception as e:
            print(f"❌ Generation failed: {e}")
    else:
        print("❌ Still failed to init client.")

if __name__ == "__main__":
    asyncio.run(main())
