import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder
from app.core.config import settings

import sys

# Setup logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

bot = Bot(token=settings.BOT_TOKEN)
dp = Dispatcher()

# TMA URL (Railway URL or local tunnel)
WEB_APP_URL = settings.FRONTEND_URL

from app.core.keyboards import get_main_menu_keyboard

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    await message.answer(
        "💎 *Welcome to Pintopay Partner*\n\n"
        "You are early! 🚀\n"
        "Join the revolution in decentralized payments.\n"
        "Earn XP, invite friends, and unlock exclusive rewards.\n\n"
        "👇 *Start your journey below*",
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard(WEB_APP_URL)
    )

async def main():
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
