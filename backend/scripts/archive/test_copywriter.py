import asyncio
import os
import sys

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.copywriter import copywriter


async def main():
    print("🚀 Testing Viral Copywriter Service...")
    
    if not copywriter.client:
        print("❌ OpenAI Client not initialized. Check OPENAI_API_KEY in backend/.env.backend")
        return

    topic = "Why Crypto Cards are replacing traditional banks in 2026"
    category = "hype_viral"
    
    print(f"📝 Generating article for topic: '{topic}' (Category: {category})...")
    
    try:
        article = await copywriter.generate_article(category, topic)
        
        if "error" in article:
            print(f"❌ Error: {article['error']}")
        else:
            print("\n✅ Article Generated Successfully!\n")
            print(f"Title: {article.get('title')}")
            print(f"Excerpt: {article.get('excerpt')}")
            print("\n--- Content Preview (First 500 chars) ---")
            print(article.get('content', '')[:500] + "...")
            print("\n--- CTA ---")
            print(article.get('cta_text'))
            
            # Check for referral link
            if copywriter.REFERRAL_LINK in article.get('cta_text', '') or copywriter.REFERRAL_LINK in article.get('content', ''):
                print("\n✅ Referral Link Present")
            else:
                print("\n⚠️ Warning: Referral Link missing from output.")

    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    asyncio.run(main())
