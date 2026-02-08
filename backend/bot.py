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
from app.services.partner_service import get_session, create_partner, process_referral_notifications
from app.core.i18n import get_msg

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    # Extract referral code from /start link if any
    referrer_code = None
    args = message.text.split()
    if len(args) > 1:
        referrer_code = args[1]
        logging.info(f"User {message.from_user.id} joined with referral code: {referrer_code}")

    # Capture language from telegram user
    lang = message.from_user.language_code or "en"
    if lang not in ["en", "ru"]:
        lang = "en"

    async for session in get_session():
        # Get or create partner
        partner, is_new = await create_partner(
            session=session,
            telegram_id=str(message.from_user.id),
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            last_name=message.from_user.last_name,
            language_code=lang,
            referrer_code=referrer_code
        )
        
        await process_referral_notifications(bot, session, partner, is_new)
        
        # Personal referral link
        bot_info = await bot.get_me()
        referral_link = f"https://t.me/{bot_info.username}?start={partner.referral_code}"

        # Get localized messages
        welcome_text = get_msg(lang, "welcome", referral_link=referral_link)
        share_text = get_msg(lang, "share_text")

        await message.answer(
            welcome_text,
            parse_mode="Markdown",
            reply_markup=get_main_menu_keyboard(WEB_APP_URL, referral_link, share_text)
        )
        break # We only need one session

async def main():
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
