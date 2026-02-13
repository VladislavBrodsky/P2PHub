import asyncio
import os
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

# Load env before imports
env_path = Path(__file__).parent / "backend" / ".env"
if env_path.exists():
    from dotenv import dotenv_values
    env_vars = dotenv_values(env_path)
    for k, v in env_vars.items():
        if v: os.environ[k] = v
    print(f"✅ Loaded {len(env_vars)} variables from {env_path}")
else:
    print(f"❌ .env not found at {env_path}")

# Now import services
from backend.app.services.viral_service import viral_studio
from backend.app.models.partner import Partner

async def verify_flow():
    print("🚀 Starting Viral Studio Verification...")
    
    # Check capabilities
    caps = viral_studio.get_capabilities()
    print(f"📡 Capabilities: {caps}")
    
    if not caps["text_generation"]:
        print("❌ Error: OpenAI not configured. Check OPENAI_API_KEY in .env")
        return

    # Create a mock partner
    mock_partner = Partner(
        id=999,
        telegram_id="test_user_123",
        username="tester",
        referral_code="VIBE2026",
        is_pro=True,
        pro_tokens=500
    )
    
    print(f"🎬 Generating viral content for: {mock_partner.username}...")
    print(f"Target: Digital Nomads | Type: Lifestyle Flex | Lang: English")
    
    result = await viral_studio.generate_viral_content(
        partner=mock_partner,
        post_type="Lifestyle Flex",
        target_audience="Digital Nomads",
        language="English"
    )
    
    print("\n--- [ GENERATION RESULT ] ---")
    print(json.dumps(result, indent=2))
    
    if result.get("status") == "success":
        print("\n✅ SUCCESS: Content produced successfully!")
        if result.get("image_url"):
            print(f"🖼️ Image generated at: {result['image_url']}")
            # Check if file exists
            backend_dir = Path(__file__).parent / "backend"
            image_path = backend_dir / result['image_url'].lstrip('/')
            if image_path.exists():
                print(f"📂 Verified image file exists on disk: {image_path}")
            else:
                # Handle images/generated path which is served via /images mount
                # The actual path is app_images/generated/...
                actual_path = backend_dir / "app_images" / "generated" / Path(result['image_url']).name
                if actual_path.exists():
                    print(f"📂 Verified image file exists correctly at: {actual_path}")
                else:
                    print(f"⚠️ Warning: Image file NOT found at expected path: {actual_path}")
    else:
        print(f"\n❌ FAILED: {result.get('error')}")
        if "error_code" in result:
            print(f"🆔 Error Code: {result['error_code']}")

if __name__ == "__main__":
    asyncio.run(verify_flow())
