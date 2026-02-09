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

from app.core.i18n import get_msg

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    from app.services.partner_service import create_partner, process_referral_notifications
    from app.core.keyboards import get_main_menu_keyboard
    from app.models.partner import get_session
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

    try:
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
    except Exception as e:
        logging.error(f"Error in cmd_start: {e}")
        await message.answer(f"⚠️ Error: {str(e)}")


from aiogram.filters import Command

@dp.message(Command("my_network", "tree", "stats"))
async def cmd_my_network(message: types.Message):
    from app.services.partner_service import get_partner_by_telegram_id, get_referral_tree_stats
    try:
        async for session in get_session():
            partner = await get_partner_by_telegram_id(session, str(message.from_user.id))
            if not partner:
                await message.answer("⚠️ You are not registered yet. Type /start to join!")
                return

            stats = await get_referral_tree_stats(session, partner.id)
            
            total_network = sum(stats.values())
            
            lines = [f"🌳 *Your Referral Network*"]
            lines.append(f"Total Partners: *{total_network}*")
            lines.append("")
            
            for level, count in stats.items():
                if count > 0:
                    lines.append(f"Level {level}: {count} partners")
            
            if total_network == 0:
                lines.append("\n_You haven't invited anyone yet. Share your link to start earning!_")
            
            await message.answer("\n".join(lines), parse_mode="Markdown")
            break
    except Exception as e:
        logging.error(f"Error in cmd_my_network: {e}")
        await message.answer(f"⚠️ Error fetching stats: {str(e)}")

async def main():
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
