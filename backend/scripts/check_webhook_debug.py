import asyncio
from aiogram import Bot
import os
from dotenv import load_dotenv

# Load from backend/.env
load_dotenv("backend/.env")
TOKEN = os.getenv("BOT_TOKEN")

async def main():
    if not TOKEN:
        print("No BOT_TOKEN found in backend/.env")
        return
    
    print(f"Checking webhook for token: {TOKEN[:5]}...{TOKEN[-5:]}")
    bot = Bot(token=TOKEN)
    try:
        info = await bot.get_webhook_info()
        print(f"Current Webhook URL: {info.url}")
        print(f"Pending Update Count: {info.pending_update_count}")
        print(f"Last Error Date: {info.last_error_date}")
        print(f"Last Error Message: {info.last_error_message}")
    except Exception as e:
        print(f"Error checking webhook: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
