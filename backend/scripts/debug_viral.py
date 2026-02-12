import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load env from diverse sources
load_dotenv("backend/.env")
load_dotenv("backend/.env.backend") 

from app.services.viral_service import viral_studio
from app.models.partner import Partner

async def test():
    print("--- Diagnostic Start ---")
    print(f"OpenAI Client: {viral_studio.openai_client}")
    print(f"GenAI Client: {viral_studio.genai_client}")
    
    partner = Partner(id=1, is_pro=True, pro_tokens=100)
    
    try:
        print("Calling generate_viral_content...")
        result = await viral_studio.generate_viral_content(
            partner=partner,
            post_type="Viral Strategy",
            target_audience="Crypto Investors",
            language="English"
        )
        print("✅ Result:", result)
    except Exception as e:
        print(f"❌ CRASH: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
