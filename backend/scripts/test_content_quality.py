import asyncio
import json
import os
import sys
from pathlib import Path
from collections import Counter

# Add backend to path
current_dir = Path(__file__).parent
backend_dir = current_dir.parent
sys.path.insert(0, str(backend_dir))

async def test_content_quality():
    print("="*80)
    print("🧪 VIRAL STUDIO - CONTENT QUALITY & BRAND DENSITY TEST")
    print("="*80)
    
    from app.services.viral_studio.studio import viral_studio
    
    # Mock Partner
    class MockPartner:
        id = 999
        is_pro = True
        is_pro_plus = False
        referral_code = "TEST_REF"
        created_at = None
        pro_tokens_last_reset = None
        subscription_plan = "PRO_MONTHLY"
    
    partner = MockPartner()
    
    # Test Parameters
    samples = 10
    mentions = 0
    
    # Target Partner Audience
    print(f"Generating {samples} posts for 'partners' audience...")
    
    for i in range(samples):
        print(f"\n[{i+1}/{samples}] Generating...")
        result = await viral_studio.generate_viral_content(
            partner=partner,
            post_type="partners_network",
            target_audience="partners",
            language="English",
            referral_link="https://t.me/pintopaybot?start=p_test"
        )
        
        if result.get("status") == "success":
            title = result.get("title")
            body = result.get("text")
            
            has_mention = "Pintopay" in body or "Pintopay" in title
            if has_mention:
                mentions += 1
                status = "🟢 EXPLICIT (Pintopay mentioned)"
            else:
                status = "🔵 SUBTLE (Between the lines)"
            
            print(f"Status: {status}")
            print(f"Title: {title}")
            print(f"Body Preview: {body[:100]}...")
        else:
            print(f"❌ Generation failed: {result.get('error')}")

    print("\n" + "="*80)
    print("📊 FINAL RESULTS")
    print("-" * 80)
    print(f"Total Samples: {samples}")
    print(f"Explicit Mentions: {mentions} ({mentions/samples*100}%)")
    print(f"Subtle Posts: {samples-mentions} ({(samples-mentions)/samples*100}%)")
    print("Target Density: ~30% Explicit / ~70% Subtle")
    print("="*80)

if __name__ == "__main__":
    # Ensure OPENAI_API_KEY and GOOGLE_API_KEY are in env or loaded from .env manually if needed
    # For this test, we assume they are already set in the environment or provided by the system
    import os
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️ OPENAI_API_KEY not found in environment.")
    
    asyncio.run(test_content_quality())
