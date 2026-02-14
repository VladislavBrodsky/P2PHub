import asyncio
import os
from aiogram import Bot

async def send_direct():
    token = "8245884329:AAEDkWwG8Si6HJtgkC7MTd5U_IQrAHmyTYk"
    chat_id = 716720099
    
    bot = Bot(token=token)
    print(f"Attempting to send direct message to {chat_id}...")
    try:
        msg = await bot.send_message(
            chat_id=chat_id, 
            text="🚀 **DIRECT TEST**: If you see this, the Bot Token and your ID are working perfectly! No background workers involved.",
            parse_mode="Markdown"
        )
        print(f"✅ Success! Message ID: {msg.message_id}")
    except Exception as e:
        print(f"❌ Failed to reach you: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(send_direct())
