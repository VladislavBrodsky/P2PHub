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

    # Capture language and photo from telegram user
    lang = message.from_user.language_code or "en"
    if lang not in ["en", "ru"]:
        lang = "en"

    # Fetch user profile photo
    photo_url = None
    try:
        user_photos = await bot.get_user_profile_photos(message.from_user.id, limit=1)
        if user_photos.total_count > 0:
            # Get the smallest photo to save bandwidth/storage
            file = await bot.get_file(user_photos.photos[0][0].file_id)
            # This is a temporary file URL, we should ideally download and serve it
            # For now, let's use the file_path if we can, or just store the ID
            # Better implementation: storage service downloads it
            photo_url = f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file.file_path}"
    except Exception as e:
        logging.error(f"Error fetching profile photo: {e}")

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
                referrer_code=referrer_code,
                photo_url=photo_url
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
                reply_markup=get_main_menu_keyboard(WEB_APP_URL, referral_link, partner.referral_code)
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
    
    # Derive the actual base domain for API assets
    if settings.WEBHOOK_URL and settings.WEBHOOK_PATH in settings.WEBHOOK_URL:
        base_api_url = settings.WEBHOOK_URL.split(settings.WEBHOOK_PATH)[0].rstrip('/')
    elif settings.WEBHOOK_URL:
        base_api_url = settings.WEBHOOK_URL.rstrip('/')
    else:
        # Fallback to frontend or localhost if backend URL not explicit
        base_api_url = (settings.FRONTEND_URL or "http://localhost:8000").rstrip('/')
    
    # Use the specific requested image from the backend assets
    chosen_photo = f"{base_api_url}/images/2026-02-05%2003.35.03.jpg"

    # Final Viral Marketing Pitch
    caption = (
        "🚀 *STOP BLEEDING MONEY TO BANKS!* 🛑\n\n"
        "Join me on Pintopay and unlock $1 per minute strategy! 💎\n"
        "Lead the revolution in FinTech & Web3 payments. 🌍"
    )

    logging.info(f"📤 Responding to inline query from {inline_query.from_user.id} with photo: {chosen_photo}")
    logging.info(f"🔗 Ref Link: {ref_link}")

    results = [
        types.InlineQueryResultPhoto(
            id=f"share_{random.randint(1, 10000)}", 
            photo_url=chosen_photo,
            thumbnail_url=chosen_photo,
            title="Elite Partner Invitation",
            description="Share your $1/minute strategy",
            caption=caption,
            parse_mode="Markdown",
            reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
                [types.InlineKeyboardButton(text="🤝 Join Partner Club", url=ref_link)]
            ])
        )
    ]
    
    logging.info(f"✅ Inline results prepared: {len(results)} items")
    
    # Set cache_time=0 or low to ensured randomness
    await inline_query.answer(results, is_personal=True, cache_time=5)

async def main():
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
