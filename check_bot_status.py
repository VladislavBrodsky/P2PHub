import asyncio
import os
from aiogram import Bot
from pathlib import Path
from dotenv import load_dotenv

async def check_bot():
    # Manually load .env to be sure
    env_path = Path("backend/.env")
    print(f"Loading .env from: {env_path.absolute()}")
    load_dotenv(dotenv_path=env_path)
    
    token = os.getenv("BOT_TOKEN")
    if not token:
        print("❌ BOT_TOKEN not found in environment!")
        return
        
    print(f"Token found: {token[:10]}...")
    
    bot = Bot(token=token)
    try:
        me = await bot.get_me()
        print(f"✅ Bot info: {me.id} | @{me.username}")
        
        webhook_info = await bot.get_webhook_info()
        print(f"ℹ️ Webhook info: {webhook_info}")
        
    except Exception as e:
        print(f"❌ Error during bot check: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(check_bot())
