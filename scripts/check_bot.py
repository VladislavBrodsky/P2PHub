
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from bot import bot

async def check_bot():
    me = await bot.get_me()
    print(f"✅ Active Bot: @{me.username} ({me.id})")

if __name__ == "__main__":
    asyncio.run(check_bot())
