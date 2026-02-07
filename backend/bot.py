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
WEB_APP_URL = "https://p2phub-frontend.up.railway.app" # Placeholder for Railway

from app.core.keyboards import get_main_menu_keyboard

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    await message.answer(
        f"👋 *Hi {message.from_user.first_name}!*\n\n"
        "Welcome to the *PinToPay Partner Hub*.\n\n"
        "Manage your virtual cards, track earnings, and grow your network all in one place.",
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard(WEB_APP_URL)
    )

async def main():
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
