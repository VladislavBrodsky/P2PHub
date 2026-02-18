
import asyncio
import os
import json
from dotenv import load_dotenv

# Load .env
load_dotenv()

from app.services.support_service import support_service

async def test_support():
    print("Testing Support Service...")
    
    # 1. Test GS client
    print("Checking Google Sheets Client...")
    gs_client = await support_service._get_gs_client()
    if gs_client:
        print("✅ Google Sheets Client authorized.")
    else:
        print("❌ Google Sheets Client failed.")

    # 2. Test KB fetch
    print("Checking Knowledge Base...")
    kb = await support_service._get_cached_kb()
    if kb:
        print(f"✅ KB fetched. TOV length: {len(kb.get('tov', ''))}, QA records: {len(kb.get('qa', []))}")
    else:
        print("❌ KB fetch failed.")

    # 3. Test Generate Response
    print("Testing AI Response...")
    user_id = "test_user_123"
    message = "How can I buy a virtual card?"
    user_metadata = {
        "first_name": "Test",
        "last_name": "User",
        "username": "testuser",
        "level": 1,
        "balance": 100.0,
        "is_pro": False
    }
    
    try:
        response = await support_service.generate_response(user_id, message, user_metadata)
        print(f"✅ AI Response: {response}")
    except Exception as e:
        print(f"❌ AI Response failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_support())
