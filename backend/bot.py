import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder
from app.core.config import settings
from app.models.partner import get_session

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
    logging.info(f"📥 Received /start command from user {message.from_user.id} (@{message.from_user.username})")
    
    from app.services.partner_service import create_partner, process_referral_notifications
    from app.core.keyboards import get_main_menu_keyboard
    
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

import random

@dp.inline_query()
async def inline_handler(inline_query: types.InlineQuery):
    # The query is the referral code passed from the Mini App
    ref_code = inline_query.query or "dev"
    bot_info = await bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start={ref_code}"
    
    # Base URL for photos (using WEBHOOK_URL if set, or FRONTEND_URL as fallback)
    base_url = settings.WEBHOOK_URL or settings.FRONTEND_URL
    if not base_url:
        return
        
    base_url = base_url.rstrip('/')
    
    # Available images
    images = [
        f"{base_url}/images/2026-02-05%2003.35.36.jpg",
        f"{base_url}/images/2026-02-05%2003.35.03.jpg"
    ]
    
    # Pick one randomly
    chosen_photo = random.choice(images)

    # Viral marketing text
    caption = (
        "🛑 STOP BLEEDING MONEY TO BANKS! 🛑\n\n"
        "Everything you know about money is changing. While others lose, the 1% are profiting. 🦅\n\n"
        "Join the Pintopay Partner Hub and start earning $1/minute in passive income.\n\n"
        "🔥 NO Bureaucracy\n"
        "🔥 NO Restrictions\n"
        "🔥 100% Financial Sovereignty\n\n"
        "Build your empire now. 👇"
    )

    results = [
        types.InlineQueryResultPhoto(
            id=f"share_{random.randint(1, 10000)}", # Unique ID to help bypass cache if needed
            photo_url=chosen_photo,
            thumbnail_url=chosen_photo,
            caption=caption,
            reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
                [types.InlineKeyboardButton(text="Get Your Card Now 🚀", url=ref_link)]
            ])
        )
    ]
    
    # Set cache_time=0 or low to ensured randomness
    await inline_query.answer(results, is_personal=True, cache_time=5)

async def main():
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
