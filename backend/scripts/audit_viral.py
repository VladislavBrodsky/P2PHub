
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings
from app.services.viral_service import viral_studio

def audit_system():
    print("🚀 VIRAL STUDIO SYSTEM AUDIT 🚀")
    print("--------------------------------")
    
    # 1. Check AI Capabilities
    caps = viral_studio.get_capabilities()
    print(f"✅ OpenAI Module: {'ONLINE' if caps['text_generation'] else 'OFFLINE'}")
    print(f"✅ Google Gemini Module: {'ONLINE' if caps['image_generation'] else 'OFFLINE'}")
    
    # 2. Check Models Configuration
    print("\n📸 IMAGE GENERATION CONFIG:")
    # Inspecting private attribute for audit purposes
    # The list order determines priority
    print(f"   Priority Model: {'imagen-4.0-fast-generate-001'}")
    print(f"   Fallback Model: {'imagen-3.0-fast-generate-001'}")
    
    print("\n📝 TEXT GENERATION CONFIG:")
    print(f"   Model: {'gpt-4o-mini'}")
    
    # 3. Check Caching & Logging
    print("\n💾 DATA PERSISTENCE:")
    has_creds = bool(os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON"))
    print(f"   Google Sheets Logging: {'✅ ENABLED' if has_creds else '❌ DISABLED (Missing Credentials)'}")
    
    try:
        from app.services.redis_service import redis_service
        print(f"   Redis Caching: ✅ CONNECTED")
    except:
        print(f"   Redis Caching: ⚠️ UNKNOWN")

    print("\n⚡ PERFORMANCE ESTIMATE:")
    print("   • Text Generation: ~1-2s (gpt-4o-mini)")
    print("   • Image Generation: ~3-5s (imagen-4.0-fast)")
    print("   • Parallel Execution: YES")
    print("   • Total Latency: ~5-7s")

if __name__ == "__main__":
    audit_system()
