import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from bot import bot

async def test_bot():
    try:
        print("Testing Telegram Bot connection...")
        me = await bot.get_me()
        print(f"✅ Success! Bot Username: @{me.username}")
    except Exception as e:
        print(f"❌ Failed to get bot info: {e}")

if __name__ == "__main__":
    asyncio.run(test_bot())
