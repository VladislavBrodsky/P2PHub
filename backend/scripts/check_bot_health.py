import os
import sys
import logging
import asyncio

# Setup paths
sys.path.append(os.getcwd())

# Mock env
os.environ.setdefault("BOT_TOKEN", "123:mock")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://mock:mock@localhost:5432/mock")

logging.basicConfig(level=logging.INFO)

async def check_bot():
    print("🔍 Checking Bot Imports...")
    try:
        from app.core.keyboards import get_main_menu_keyboard
        from app.core.i18n import get_msg
        
        # 1. Check Keyboards
        kb = get_main_menu_keyboard("https://google.com", "https://t.me/share...", "REF123")
        print("✅ Keyboard generated successfully")
        
        # Check if button is there (simple check)
        kb_json = kb.json()
        if "Send Premium Card" in kb_json:
            print("✅ 'Send Premium Card' found in keyboard")
        else:
            print("❌ 'Send Premium Card' NOT found in keyboard")
            print(kb_json)
            
        # 2. Check i18n
        msg = get_msg("en", "welcome", referral_link="https://t.me...")
        if "🥳 You are early!" in msg:
             print("✅ Welcome message updated correctly")
        else:
             print("❌ Welcome message is SCARY OLD")
             print(msg)
             
        # 3. Check Bot File Import
        import bot
        print("✅ bot.py imported successfully")
        
    except Exception as e:
        print(f"❌ Error during check: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(check_bot())
