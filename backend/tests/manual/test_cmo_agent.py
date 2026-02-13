import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock

# Add backend directory to path so imports like 'app.core' work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

# Properly mock config and other modules BEFORE they are imported by viral_service
mock_settings = MagicMock()
mock_settings.VIRAL_POST_TYPES = ["Product Launch", "FOMO Builder", "Lifestyle Flex", "System Authority", "Passive Income Proof", "Network Growth", "Web3 Tutorial"]
mock_settings.VIRAL_AUDIENCES = ["Crypto Traders", "Digital Nomads", "Affiliate Marketers", "Network Builders"]
mock_settings.OPENAI_API_KEY = "sk-mock-key"
mock_settings.GEMINI_API_KEY = "mock-gemini-key"

sys.modules['app.core.config'] = MagicMock()
sys.modules['app.core.config'].settings = mock_settings

# Mock models
sys.modules['app.models.partner'] = MagicMock()
sys.modules['app.core.errors'] = MagicMock()
sys.modules['app.services.openai_service'] = MagicMock() # Ensure this is mocked if used
sys.modules['google'] = MagicMock()
sys.modules['google.genai'] = MagicMock()
sys.modules['google.oauth2.service_account'] = MagicMock()
sys.modules['gspread'] = MagicMock()
sys.modules['openai'] = MagicMock()
sys.modules['sqlmodel'] = MagicMock()
sys.modules['sqlmodel.ext.asyncio.session'] = MagicMock()
sys.modules['pil'] = MagicMock()
sys.modules['PIL'] = MagicMock()
sys.modules['aiogram'] = MagicMock()

try:
    from app.services.viral_service import ViralMarketingStudio
    from app.core.cmo_intelligence import AudienceProfile, ContentCategory, NativeLanguageOptimization

    print("✅ Successfully imported ViralService and CMO Intelligence System")

    # Instantiate service (mocking dependencies inside)
    studio = ViralMarketingStudio()
    print("✅ ViralMarketingStudio instantiated")

    # Mock OpenAI client response using AsyncMock for awaitable calls
    mock_openai = MagicMock()
    mock_openai.chat.completions.create = AsyncMock()
    studio.openai_client = mock_openai
    
    # Mock partner
    mock_partner = MagicMock()
    mock_partner.referral_code = "TESTREF123"

    # Test prompt generation for a specific scenario
    target_audience = "Digital Nomads"
    post_type = "Lifestyle Flex"
    language = "English"

    print(f"\n🧪 Testing Content Generation for: {target_audience} + {post_type} in {language}")

    # We need to run this in an event loop because generate_viral_content is async
    async def test_generation():
        # Mock the API response structure
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"title": "Test Title", "body": "Test Body", "hashtags": [], "image_description": "Test Image"}'
        
        # Configure the AsyncMock to return the mock_response
        studio.openai_client.chat.completions.create.return_value = mock_response

        # Mock image generation too if it is called
        # Assuming generate_viral_content calls image gen internally? 
        # Actually generate_viral_content returns prompt output usually or full dict.
        # Let's see what happens.
        
        # Prevent Google GenAI calls if they exist
        studio.genai_client = MagicMock()
        studio.genai_client.aio.models.generate_content = AsyncMock()
        mock_img_response = MagicMock()
        mock_img_response.text = "Generated Image Prompt"
        studio.genai_client.aio.models.generate_content.return_value = mock_img_response

        # The function signature for generate_viral_content is:
        # partner: Partner
        # post_type: str
        # target_audience: str
        # language: str
        # referral_link: Optional[str]
        
        # Wait, the signature in method def was:
        # partner, post_type, target_audience, language, referral_link=None
        # But here I am calling it with correct kw args.
        
        # Oh wait, verify signature again.
        # 234:         partner: Partner, 
        # 235:         post_type: str, 
        # 236:         target_audience: str, 
        # 237:         language: str,

        await studio.generate_viral_content(
            partner=mock_partner,
            post_type=post_type,
            target_audience=target_audience,
            language=language
        )
        
        # Verify the call arguments
        call_args = studio.openai_client.chat.completions.create.call_args
        if call_args:
            kwargs = call_args.kwargs
            messages = kwargs.get('messages', [])
            for msg in messages:
                if msg['role'] == 'system':
                    print("\n📝 GENERATED SYSTEM PROMPT PREVIEW:\n" + "="*50)
                    print(msg['content'][:1500] + "...\n(truncated)")
                    print("="*50)
                if msg['role'] == 'user':
                    print("\n👤 USER PROMPT PREVIEW:\n" + "-"*50)
                    print(msg['content'])
                    print("-" * 50)
        else:
            print("❌ OpenAI client was not called!")

    asyncio.run(test_generation())

except Exception as e:
    print(f"❌ Error during execution: {e}")
    import traceback
    traceback.print_exc()
