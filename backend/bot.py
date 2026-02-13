import asyncio
import logging
import secrets
import sys
import urllib.parse

from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command, CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder

from app.core.config import settings
from app.core.i18n import get_msg
from app.models.partner import get_session

# #comment: Centralizing bot initialization and configurations. 
# We use a deferred import pattern for services in handlers to avoid circular dependencies.
# The bot instance is shared across the entire backend (API workers and background tasks).
bot = Bot(token=settings.BOT_TOKEN)
dp = Dispatcher()

# TMA URL (Railway URL or local tunnel)
WEB_APP_URL = settings.FRONTEND_URL


@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    logging.info(f"📥 Received /start command from user {message.from_user.id} (@{message.from_user.username})")

    from app.core.keyboards import get_main_menu_keyboard
    from app.services.partner_service import create_partner
    from app.services.referral_service import process_referral_notifications

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

    # Fetch user profile photo file_id
    photo_file_id = None
    try:
        user_photos = await bot.get_user_profile_photos(message.from_user.id, limit=1)
        if user_photos.total_count > 0:
            # Store the file_id which we can use to fetch the photo anytime
            photo_file_id = user_photos.photos[0][0].file_id
            logging.info(f"✅ Captured photo file_id for user {message.from_user.id}")
    except Exception as e:
        logging.error(f"❌ Error fetching profile photo: {e}")

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
                photo_file_id=photo_file_id
            )

            await process_referral_notifications(bot, session, partner, is_new)

            # Personal referral link
            bot_info = await bot.get_me()
            referral_link = f"https://t.me/{bot_info.username}?start={partner.referral_code}"

            # Get localized messages
            welcome_text = get_msg(lang, "welcome", referral_link=referral_link)
            share_text = get_msg(lang, "share_text")

            # Construct direct sharing URL
            share_url = f"https://t.me/share/url?url={urllib.parse.quote(referral_link)}&text={urllib.parse.quote(share_text)}"

            await message.answer(
                welcome_text,
                parse_mode="Markdown",
                reply_markup=get_main_menu_keyboard(WEB_APP_URL, share_url, referral_code=partner.referral_code)
            )

            break # We only need one session
    except Exception as e:
        logging.error(f"Error in cmd_start: {e}")
        await message.answer(f"⚠️ Error: {str(e)}")





@dp.message(Command("my_network", "tree", "stats"))
async def cmd_my_network(message: types.Message):
    from app.services.partner_service import (
        get_partner_by_telegram_id,
        get_referral_tree_stats,
    )
    try:
        async for session in get_session():
            partner = await get_partner_by_telegram_id(session, str(message.from_user.id))
            if not partner:
                await message.answer("⚠️ You are not registered yet. Type /start to join!")
                return

            stats = await get_referral_tree_stats(session, partner.id)

            total_network = sum(stats.values())

            lines = ["🌳 *Your Referral Network*"]
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


# Cache bot username to avoid repeated API calls
BOT_USERNAME = None

@dp.inline_query()
async def inline_handler(inline_query: types.InlineQuery):
    global BOT_USERNAME
    try:
        if not BOT_USERNAME:
            bot_info = await bot.get_me()
            BOT_USERNAME = bot_info.username.replace("@", "")

        ref_code = inline_query.query or ""
        query_code = ref_code if ref_code else "start"
        ref_link = f"https://t.me/{BOT_USERNAME}?start={query_code}"

        # Base URL for assets
        if settings.WEBHOOK_URL and settings.WEBHOOK_PATH in settings.WEBHOOK_URL:
            base_api_url = settings.WEBHOOK_URL.split(settings.WEBHOOK_PATH)[0].rstrip('/')
        else:
            base_api_url = (settings.FRONTEND_URL or "https://p2phub-production.up.railway.app").rstrip('/')

        photo1 = f"{base_api_url}/images/2026-02-05 03.35.03.jpg".replace(" ", "%20")
        photo2 = f"{base_api_url}/images/2026-02-05 03.35.36.jpg".replace(" ", "%20")

        # Try to find partner language
        # Try to find partner language
        lang = inline_query.from_user.language_code or "en"
        if lang not in ["en", "ru"]:
            lang = "en"

        caption = get_msg(lang, "viral_share_caption", referral_link=ref_link)

        logging.info(f"📤 Inline query: {query_code}")

        # Use random ID suffix for stability during testing
        rand_id = str(1000 + secrets.randbelow(9000))

        results = [
            # Card 1: Premium Visual Card v1
            types.InlineQueryResultPhoto(
                id=f"card1_{query_code}_{rand_id}",
                photo_url=photo1,
                thumbnail_url=photo1,
                title="Premium Card v1",
                description="Share your $1/minute strategy",
                caption=caption,
                parse_mode="Markdown",
                reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
                    [types.InlineKeyboardButton(text="🤝 Join Partner Club", url=ref_link)]
                ])
            ),
            # Card 2: Premium Visual Card v2
            types.InlineQueryResultPhoto(
                id=f"card2_{query_code}_{rand_id}",
                photo_url=photo2,
                thumbnail_url=photo2,
                title="Premium Card v2",
                description="Share your $1/minute strategy",
                caption=caption,
                parse_mode="Markdown",
                reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
                    [types.InlineKeyboardButton(text="🤝 Join Partner Club", url=ref_link)]
                ])
            )
        ]

        await inline_query.answer(results, is_personal=True, cache_time=0)

    except Exception as e:
        logging.error(f"❌ Inline handler error: {e}")
        try:
            await inline_query.answer([], is_personal=True, cache_time=0)
        except: pass


@dp.message(Command("support", "care", "help"))
async def cmd_support(message: types.Message):
    from app.core.keyboards import get_support_keyboard
    text = (
        "🌟 *PINTOPAY CUSTOMER CARE*\n\n"
        "How can we improve your experience today?\n"
        "Select a category below for instant instructions and 5-star support."
    )
    await message.answer(text, parse_mode="Markdown", reply_markup=get_support_keyboard())

@dp.callback_query(F.data.startswith("sup_"))
async def callback_support_category(callback: types.CallbackQuery):
    from app.services.support_service import support_service
    from app.services.partner_service import get_partner_by_telegram_id
    
    cat_map = {
        "sup_cards": "💳 Virtual & Physical Cards",
        "sup_setup": "🚀 Card Setup & Activation",
        "sup_topup": "💰 Top-ups & Crypto Deposits",
        "sup_mobile": "📲 Mobile Payments (Apple/Google Pay)",
        "sup_pro": "💎 PRO Membership & Benefits",
        "sup_partner": "🤝 Partner Network & Earnings",
        "sup_safety": "🔒 Account Security & Safety",
        "sup_trading": "⚡ Trading & Transactions",
        "sup_vip": "☎️ VIP Priority Support"
    }
    
    category_name = cat_map.get(callback.data, "General")
    user_id = str(callback.from_user.id)
    
    # Get initial instructions (checklists) from fallback library
    instructions = support_service.FALLBACK_INSTRUCTIONS.get(category_name, ["Please describe your issue."])
    instr_text = "\n".join([f"• {i}" for i in instructions])
    
    await callback.message.edit_text(
        f"📍 *{category_name}*\n\n"
        f"Quick Instructions:\n{instr_text}\n\n"
        "💡 *Need more help?* Just reply to this message and our Expert AI Support Team will assist you instantly!",
        parse_mode="Markdown"
    )
    
    # Pre-select category in AI session
    session = await support_service.get_session(user_id)
    session["category"] = category_name
    await support_service.update_session(user_id, session)
    
    await callback.answer()

@dp.callback_query(F.data == "buy_pro")
async def callback_buy_pro(callback: types.CallbackQuery):
    await handle_buy_pro(callback.message)
    await callback.answer()

async def handle_buy_pro(message: types.Message):
    from app.core.keyboards import get_pro_payment_keyboard
    from app.services.partner_service import get_partner_by_telegram_id
    from app.services.payment_service import payment_service

    try:
        async for session in get_session():
            partner = await get_partner_by_telegram_id(session, str(message.chat.id))
            if not partner:
                await message.answer("⚠️ You are not registered yet. Type /start to join!")
                return

            if partner.is_pro:
                await message.answer("✅ You are already a PRO member! Enjoy your benefits.")
                return

            # Create payment session
            payment_data = await payment_service.create_payment_session(session, partner.id)

            text = (
                "👑 *UPGRADE TO PRO*\n\n"
                "Unlock the full potential of Pintopay:\n"
                "• 9-Level Affiliate System\n"
                "• X5 XP Multiplier\n"
                "• Priority Payouts\n"
                "• VIP Support\n\n"
                f"💰 *Price:* {payment_data['amount_ton']} TON (~$39)\n"
                f"⏳ *Valid for:* 10 minutes\n\n"
                "Please send the exact amount to the address below:"
            )

            # Send the address as a separate message for easy copying, or just include in code block
            text += f"\n\n`{payment_data['address']}`"

            await message.answer(
                text,
                parse_mode="Markdown",
                reply_markup=get_pro_payment_keyboard(payment_data['address'], payment_data['amount_ton'])
            )
            break
    except Exception as e:
        logging.error(f"Error in handle_buy_pro: {e}")
        await message.answer("⚠️ Session creation failed. Please try again later.")

@dp.callback_query(F.data == "verify_pro_payment")
async def callback_verify_pro(callback: types.CallbackQuery):

    # Ask for TX hash
    await callback.message.answer(
        "📝 *Verification Step*\n\n"
        "Please paste the *Transaction Hash* (TX ID) of your payment below. "
        "I will verify it on the TON blockchain immediately.",
        parse_mode="Markdown"
    )
    await callback.answer()

@dp.message(F.text.regexp(r'^[a-fA-F0-9]{64}$')) # Simple regex for TON hash
async def handle_tx_hash(message: types.Message):
    from app.core.keyboards import get_main_menu_keyboard
    from app.services.partner_service import get_partner_by_telegram_id
    from app.services.payment_service import payment_service

    tx_hash = message.text.strip()
    wait_msg = await message.answer("⏳ *Verifying transaction...* Please wait a moment.")

    try:
        async for session in get_session():
            partner = await get_partner_by_telegram_id(session, str(message.from_user.id))
            if not partner: return

            success = await payment_service.verify_ton_transaction(session, partner, tx_hash)

            if success:
                await wait_msg.edit_text(
                    "🎉 *WELCOME TO PRO!*\n\n"
                    "Your payment has been verified. You now have full access to all premium features!",
                    parse_mode="Markdown"
                )
                # Show main menu again with new status
                bot_info = await bot.get_me()
                referral_link = f"https://t.me/{bot_info.username}?start={partner.referral_code}"
                share_text = get_msg(partner.language_code or "en", "share_text")
                share_url = f"https://t.me/share/url?url={urllib.parse.quote(referral_link)}&text={urllib.parse.quote(share_text)}"

                await message.answer(
                    "What would you like to do next?",
                    reply_markup=get_main_menu_keyboard(WEB_APP_URL, share_url, referral_code=partner.referral_code)
                )

            else:
                await wait_msg.edit_text(
                    "❌ *Verification Failed*\n\n"
                    "I couldn't find a matching transaction for this hash, or your payment session has expired (10 min limit).\n\n"
                    "If you just paid, wait 30 seconds and try again. If the session expired, please start a new one.",
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardBuilder().row(
                        types.InlineKeyboardButton(text="🔄 Try Again", callback_data="buy_pro")
                    ).as_markup()
                )
            break
    except Exception as e:
        logging.error(f"Error in handle_tx_hash: {e}")
        await wait_msg.edit_text("⚠️ Verification error. Please contact support.")

@dp.callback_query(F.data == "cancel_payment")
async def callback_cancel_payment(callback: types.CallbackQuery):
    await callback.message.edit_text("❌ Payment cancelled. You can upgrade to PRO anytime by typing /pro.")
    await callback.answer()

@dp.message(F.text & ~F.text.startswith('/'))
async def handle_support_chat(message: types.Message):
    """
    Catch-all Support Chat handler.
    Natural language queries are routed to the AI Support Agent.
    """
    from app.services.support_service import support_service
    from app.services.partner_service import get_partner_by_telegram_id
    
    user_id = str(message.from_user.id)
    
    # Skip processing if it's a very short or junk message
    if len(message.text.strip()) < 2:
        return

    # Show typing indicator for a premium human-like feel
    try:
        await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    except: pass
    
    try:
        async for session_db in get_session():
            partner = await get_partner_by_telegram_id(session_db, user_id)
            user_metadata = {
                "first_name": message.from_user.first_name,
                "last_name": message.from_user.last_name,
                "username": message.from_user.username,
                "is_pro": partner.is_pro if partner else False,
                "level": partner.level if partner else 1,
                "balance": float(partner.balance) if partner else 0.0
            }
            
            response = await support_service.generate_response(
                user_id=user_id,
                message=message.text,
                user_metadata=user_metadata
            )
            
            # Splitting response if it's too long for Telegram (limit 4096)
            if len(response) > 4000:
                chunks = [response[i:i+4000] for i in range(0, len(response), 4000)]
                for chunk in chunks:
                    await message.answer(chunk, parse_mode="Markdown")
            else:
                await message.answer(response, parse_mode="Markdown")
            break
    except Exception as e:
        logging.error(f"❌ Error in support chat handler: {e}")
        await message.answer("I apologize, but my circuits are currently busy improving our elite services. Please try again in 30 seconds!")

async def main():
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())

# Deployment refresh: Tue Feb 10 23:32:50 CST 2026
