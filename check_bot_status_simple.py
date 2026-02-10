import asyncio
import sys
from aiogram import Bot

async def check_bot(token):
    print(f"Checking token: {token[:10]}...")
    bot = Bot(token=token)
    try:
        me = await bot.get_me()
        print(f"✅ Bot info: {me.id} | @{me.username}")
        
        webhook_info = await bot.get_webhook_info()
        print(f"ℹ️ Webhook info: {webhook_info}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 check_bot_status_simple.py <token>")
        sys.exit(1)
    asyncio.run(check_bot(sys.argv[1]))
