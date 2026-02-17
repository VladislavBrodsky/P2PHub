#!/usr/bin/env python3
"""
Viral Studio Content Generation - Full Diagnostic & Test
This script tests the entire flow from API keys to final content generation.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

async def diagnostic_test():
    print("="*80)
    print("🔍 VIRAL STUDIO - COMPREHENSIVE DIAGNOSTIC TEST")
    print("="*80)
    print()
    
    # Step 1: Check environment variables
    print("📋 STEP 1: Environment Variables Check")
    print("-" * 80)
    
    from dotenv import load_dotenv
    env_path = backend_dir / '.env'
    print(f"DEBUG: Looking for .env at: {env_path}")
    print(f"DEBUG: File exists: {env_path.exists()}")
    load_dotenv(dotenv_path=env_path)
    
    openai_key = os.getenv('OPENAI_API_KEY', '')
    google_key = os.getenv('GOOGLE_API_KEY', '')
    
    print(f"OPENAI_API_KEY: {'✅ SET (' + str(len(openai_key)) + ' chars)' if openai_key else '❌ NOT SET'}")
    print(f"GOOGLE_API_KEY: {'✅ SET (' + str(len(google_key)) + ' chars)' if google_key else '❌ NOT SET'}")
    print()
    
    if not openai_key or not google_key:
        print("❌ CRITICAL: Missing API keys in .env file!")
        print()
        print("Please add to backend/.env:")
        print("  OPENAI_API_KEY=sk-...")
        print("  GOOGLE_API_KEY=AIza...")
        return False
    
    # Step 2: Test OpenAI initialization
    print("📋 STEP 2: OpenAI Client Initialization")
    print("-" * 80)
    
    try:
        from openai import AsyncOpenAI
        openai_client = AsyncOpenAI(api_key=openai_key)
        print("✅ OpenAI client created successfully")
    except Exception as e:
        print(f"❌ Failed to create OpenAI client: {e}")
        return False
    
    # Step 3: Test Google GenAI initialization
    print()
    print("📋 STEP 3: Google GenAI Client Initialization")
    print("-" * 80)
    
    try:
        from google import genai as google_genai
        genai_client = google_genai.Client(api_key=google_key)
        print("✅ Google GenAI client created successfully")
    except Exception as e:
        print(f"❌ Failed to create Google GenAI client: {e}")
        return False
    
    # Step 4: Test OpenAI API call
    print()
    print("📋 STEP 4: Test OpenAI API Call (gpt-4o-mini)")
    print("-" * 80)
    
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Respond in JSON format."},
                {"role": "user", "content": "Generate a test JSON with fields: title, body, hashtags (array of 3 hashtags)"}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        print("✅ OpenAI API call successful!")
        print(f"   Response: {json.dumps(result, indent=2)}")
        print(f"   Tokens used: {response.usage.total_tokens if response.usage else 'N/A'}")
    except Exception as e:
        print(f"❌ OpenAI API call failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Full error: {e!s}")
        return False
    
    # Step 5: Test Gemini API call
    print()
    print("📋 STEP 5: Test Gemini API Call (gemini-1.5-flash)")
    print("-" * 80)
    
    try:
        from google.genai import types as genai_types
        
        gemini_response = genai_client.models.generate_content(
            model='gemini-1.5-flash',
            contents="Generate a test JSON with fields: title, body, hashtags (array of 3 hashtags)",
            config=genai_types.GenerateContentConfig(
                response_mime_type='application/json',
                temperature=0.7
            )
        )
        
        result = json.loads(gemini_response.text)
        print("✅ Gemini API call successful!")
        print(f"   Response: {json.dumps(result, indent=2)}")
    except Exception as e:
        print(f"❌ Gemini API call failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Full error: {e!s}")
        return False
    
    # Step 6: Test Viral Service
    print()
    print("📋 STEP 6: Test Viral Marketing Studio")
    print("-" * 80)
    
    try:
        from app.services.viral_service import viral_studio
        
        capabilities = viral_studio.get_capabilities()
        print("✅ Viral Studio initialized")
        print(f"   Text Generation: {'✅' if capabilities.get('text_generation') else '❌'}")
        print(f"   Image Generation: {'✅' if capabilities.get('image_generation') else '❌'}")
        print(f"   Sheets Logging: {'✅' if capabilities.get('sheets_logging') else '❌'}")
    except Exception as e:
        print(f"❌ Viral Studio initialization failed: {e}")
        return False
    
    # Step 7: Full content generation test
    print()
    print("📋 STEP 7: Full Content Generation Test")
    print("-" * 80)
    
    try:
        # Create a mock partner
        class MockPartner:
            id = 999
            telegram_id = "test_user"
            is_pro = True
            pro_tokens = 10
        
        mock_partner = MockPartner()
        
        result = await viral_studio.generate_viral_content(
            partner=mock_partner,
            post_type="referral",
            target_audience="crypto_traders",
            language="English",
            referral_link="https://test.com/ref/999",
            session=None
        )
        
        if result.get("status") == "failed":
            print("❌ Content generation failed!")
            print(f"   Error code: {result.get('error_code')}")
            print(f"   Error message: {result.get('error')}")
            return False
        
        print("✅ Content generation successful!")
        print(f"   Title: {result.get('title', '')[:50]}...")
        print(f"   Body length: {len(result.get('text', ''))} chars")
        print(f"   Hashtags: {result.get('hashtags', [])}")
        print(f"   Image URL: {result.get('image_url', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Content generation failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        return False
    
    # All tests passed!
    print()
    print("="*80)
    print("✅ ALL TESTS PASSED! Viral Studio is fully operational.")
    print("="*80)
    return True

if __name__ == "__main__":
    success = asyncio.run(diagnostic_test())
    sys.exit(0 if success else 1)
