import asyncio
import contextlib
import logging
import secrets
import sys
import urllib.parse

import sentry_sdk
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command, CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

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

# #comment: Sentry Middleware for Telegram Bot
# This middleware runs for every update (message, callback, etc.)
# and sets the Sentry user context so we know WHO encountered the error.
@dp.update.outer_middleware()
async def sentry_middleware(handler, event, data):
    user = getattr(event, "from_user", None)
    if user:
        with sentry_sdk.configure_scope() as scope:
            scope.set_user({
                "id": str(user.id),
                "username": user.username,
                "language": user.language_code
            })
            scope.set_tag("telegram_id", str(user.id))
    return await handler(event, data)


class OnboardingStates(StatesGroup):
    waiting_for_onboarding = State()
    waiting_for_verification_method = State()
    waiting_for_phone = State()
    waiting_for_passport = State()


@dp.message(CommandStart())
async def cmd_start(message: types.Message, state: FSMContext):
    logging.info(f"📥 Received /start command from user {message.from_user.id}")

    from app.core.keyboards import get_main_menu_keyboard, get_onboarding_keyboard, get_main_active_menu_keyboard
    from app.services.partner_service import create_partner, get_partner_by_telegram_id

    # Extract referral code
    referrer_code = None
    args = message.text.split()
    if len(args) > 1:
        referrer_code = args[1]

    lang = message.from_user.language_code if message.from_user.language_code in ["en", "ru"] else "en"

    try:
        async for session in get_session():
            partner, is_new = await create_partner(
                session=session,
                telegram_id=str(message.from_user.id),
                username=message.from_user.username,
                first_name=message.from_user.first_name,
                last_name=message.from_user.last_name,
                language_code=lang, 
                referrer_code=referrer_code
            )
            
            lang = partner.language_code or lang

            # If user is verified, show main menu immediately
            if partner.is_verified:
                await message.answer(
                    get_msg(lang, "welcome_back", name=partner.first_name or "Partner"),
                    reply_markup=get_main_active_menu_keyboard(lang)
                )
                return

            # Otherwise, start onboarding (or just show main menu as requested)
            welcome_image_path = "assets/branding/welcome_illustration.png"
            referral_link = f"https://t.me/{settings.BOT_USERNAME}?start={partner.referral_code}"
            try:
                from aiogram.types import FSInputFile
                photo = FSInputFile(welcome_image_path)
                await message.answer_photo(
                    photo=photo,
                    caption=get_msg(lang, "onboarding_welcome", name=partner.first_name or "Partner", referral_link=referral_link),
                    parse_mode="Markdown",
                    reply_markup=get_main_menu_keyboard(WEB_APP_URL, referral_link=referral_link, referral_code=partner.referral_code, lang=lang)
                )
            except Exception:
                await message.answer(
                    get_msg(lang, "onboarding_welcome", name=partner.first_name or "Partner", referral_link=referral_link),
                    parse_mode="Markdown",
                    reply_markup=get_main_menu_keyboard(WEB_APP_URL, referral_link=referral_link, referral_code=partner.referral_code, lang=lang)
                )
            
            await state.set_state(OnboardingStates.waiting_for_onboarding)
            break
    except Exception as e:
        logging.error(f"Error in cmd_start: {e}")
        await message.answer(f"⚠️ Error: {e!s}")

@dp.callback_query(F.data == "onboarding_info")
async def process_onboarding_info(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.from_user.language_code if callback.from_user.language_code in ["en", "ru"] else "en"
    from app.core.keyboards import get_onboarding_keyboard
    await callback.message.edit_caption(
        caption=get_msg(lang, "onboarding_info_text"),
        reply_markup=get_onboarding_keyboard(lang)
    )
    await callback.answer()

@dp.callback_query(F.data == "start_verification")
async def process_start_verification(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.from_user.language_code if callback.from_user.language_code in ["en", "ru"] else "en"
    from app.core.keyboards import get_verification_keyboard
    await callback.message.edit_caption(
        caption=get_msg(lang, "verification_start"),
        reply_markup=get_verification_keyboard(lang)
    )
    await state.set_state(OnboardingStates.waiting_for_verification_method)
    await callback.answer()

@dp.callback_query(F.data == "verify_phone")
async def process_verify_phone(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.from_user.language_code if callback.from_user.language_code in ["en", "ru"] else "en"
    kb = types.ReplyKeyboardMarkup(
        keyboard=[[types.KeyboardButton(text=get_msg(lang, "btn_verify_phone"), request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    await callback.message.answer(get_msg(lang, "prompt_phone"), reply_markup=kb)
    await state.set_state(OnboardingStates.waiting_for_phone)
    await callback.answer()

@dp.callback_query(F.data == "verify_passport")
async def process_verify_passport(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.from_user.language_code if callback.from_user.language_code in ["en", "ru"] else "en"
    await callback.message.answer(get_msg(lang, "prompt_passport"))
    await state.set_state(OnboardingStates.waiting_for_passport)
    await callback.answer()

@dp.callback_query(F.data == "test_verify_bypass")
async def process_test_verify(callback: types.CallbackQuery, state: FSMContext):
    lang = callback.from_user.language_code if callback.from_user.language_code in ["en", "ru"] else "en"
    from app.core.keyboards import get_main_active_menu_keyboard
    from app.services.partner_service import get_partner_by_telegram_id

    async for session in get_session():
        partner = await get_partner_by_telegram_id(session, str(callback.from_user.id))
        if partner:
            partner.is_verified = True
            session.add(partner)
            await session.commit()
            
            await callback.message.answer(get_msg(lang, "verification_success"), reply_markup=get_main_active_menu_keyboard(lang))
            await state.clear()
        break
    await callback.answer()

@dp.message(OnboardingStates.waiting_for_phone, F.contact)
async def handle_contact(message: types.Message, state: FSMContext):
    lang = message.from_user.language_code if message.from_user.language_code in ["en", "ru"] else "en"
    from app.core.keyboards import get_main_active_menu_keyboard
    from app.services.partner_service import get_partner_by_telegram_id

    async for session in get_session():
        partner = await get_partner_by_telegram_id(session, str(message.from_user.id))
        if partner:
            partner.is_verified = True
            # In real system, we might store the phone
            session.add(partner)
            await session.commit()
            
            await message.answer(get_msg(lang, "verification_success"), reply_markup=get_main_active_menu_keyboard(lang))
            await state.clear()
        break

@dp.message(OnboardingStates.waiting_for_passport, F.photo)
async def handle_passport_photo(message: types.Message, state: FSMContext):
    lang = message.from_user.language_code if message.from_user.language_code in ["en", "ru"] else "en"
    from app.core.keyboards import get_main_active_menu_keyboard
    from app.services.partner_service import get_partner_by_telegram_id

    await message.answer(get_msg(lang, "processing_verification"))
    
    try:
        # Simulate approval after short delay or just approve immediately for testing
        async for session in get_session():
            partner = await get_partner_by_telegram_id(session, str(message.from_user.id))
            if partner:
                partner.is_verified = True
                session.add(partner)
                await session.commit()
                
                await message.answer(get_msg(lang, "verification_success"), reply_markup=get_main_active_menu_keyboard(lang))
                await state.clear()
            break
    except Exception as e:
        logging.error(f"Error in handle_passport_photo: {e}")
        sentry_sdk.capture_exception(e)
        await message.answer(f"⚠️ Error: {e!s}")





@dp.message(Command("my_network", "tree", "stats"))
async def cmd_my_network(message: types.Message):
    from app.services.partner_service import (
        get_partner_by_telegram_id,
        get_referral_tree_stats,
    )
    try:
        async for session in get_session():
            partner = await get_partner_by_telegram_id(session, str(message.from_user.id))
            lang = partner.language_code if partner and partner.language_code in ["en", "ru"] else ("ru" if message.from_user.language_code == "ru" else "en")
            
            if not partner:
                await message.answer(get_msg(lang, "not_registered_error"))
                return

            stats = await get_referral_tree_stats(session, partner.id)

            total_network = sum(stats.values())

            lines = [get_msg(lang, "my_network_title")]
            lines.append(get_msg(lang, "my_network_total", count=total_network))
            lines.append("")

            for level, count in stats.items():
                if count > 0:
                    lines.append(get_msg(lang, "my_network_level_count", level=level, count=count))

            if total_network == 0:
                lines.append(get_msg(lang, "my_network_empty"))

            await message.answer("\n".join(lines), parse_mode="Markdown")
            break
    except Exception as e:
        logging.error(f"Error in cmd_my_network: {e}")
        sentry_sdk.capture_exception(e)
        lang = "en" # Fallback
        if message.from_user.language_code == "ru": lang = "ru"
        await message.answer(get_msg(lang, "fetch_stats_error", e=str(e)))


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

        photo1 = f"{base_api_url}/images/2026-02-05_03.35.03.webp"
        photo2 = f"{base_api_url}/images/2026-02-05_03.35.36.webp"

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
                title="💎 Elite Invitation",
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
                title="🚀 Viral Strategy",
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
        with contextlib.suppress(Exception):
            await inline_query.answer([], is_personal=True, cache_time=0)


@dp.message(F.text.in_([get_msg("en", "btn_menu_profile"), get_msg("ru", "btn_menu_profile")]))
async def menu_profile(message: types.Message):
    # Reuse existing /profile logic or commands
    await message.answer("👤 *Profile Section*\n\nYour advanced stats are available in the Mini App.", parse_mode="Markdown")

@dp.message(F.text.in_([get_msg("en", "btn_menu_balance"), get_msg("ru", "btn_menu_balance")]))
async def menu_balance(message: types.Message):
    from app.services.partner_service import get_partner_by_telegram_id
    async for session in get_session():
        partner = await get_partner_by_telegram_id(session, str(message.from_user.id))
        if partner:
            lang = partner.language_code or "en"
            await message.answer(f"💰 *Your Balance*\n\nAvailable: `{partner.balance}` USDT\nXP Score: `{partner.xp}`", parse_mode="Markdown")
        break

@dp.message(F.text.in_([get_msg("en", "btn_menu_topup"), get_msg("ru", "btn_menu_topup")]))
async def menu_topup(message: types.Message):
    await message.answer("💳 *Deposit Funds*\n\nChoose your network in the Mini App to generate a deposit address.", parse_mode="Markdown")

@dp.message(F.text.in_([get_msg("en", "btn_menu_payout"), get_msg("ru", "btn_menu_payout")]))
async def menu_payout(message: types.Message):
    await message.answer("💸 *Withdraw Funds*\n\nMinimum payout is 10 USDT. Manage your withdrawals in the Finance tab.", parse_mode="Markdown")

@dp.message(F.text.in_([get_msg("en", "btn_menu_purchase"), get_msg("ru", "btn_menu_purchase")]))
async def menu_purchase(message: types.Message):
    await message.answer("🔄 *Exchange & Purchase*\n\nSwap your assets or buy gift cards and vouchers instantly.", parse_mode="Markdown")

@dp.message(F.text.in_([get_msg("en", "btn_menu_history"), get_msg("ru", "btn_menu_history")]))
async def menu_history(message: types.Message):
    await message.answer("📊 *Transaction History*\n\nView your full audit trail in the History section of the app.", parse_mode="Markdown")

@dp.message(Command("support", "care", "help"))
async def cmd_support(message: types.Message):
    from app.core.keyboards import get_support_keyboard
    lang = "ru" if message.from_user.language_code == "ru" else "en"
    
    text = get_msg(lang, "support_intro")
    await message.answer(text, parse_mode="Markdown", reply_markup=get_support_keyboard(lang=lang))

@dp.callback_query(F.data.startswith("sup_"))
async def callback_support_category(callback: types.CallbackQuery):
    from app.services.partner_service import get_partner_by_telegram_id
    from app.services.support_service import support_service
    
    lang = "ru" if callback.from_user.language_code == "ru" else "en"
    
    cat_map_keys = {
        "sup_cards": "cat_cards",
        "sup_setup": "cat_setup",
        "sup_topup": "cat_topup",
        "sup_mobile": "cat_mobile",
        "sup_pro": "cat_pro",
        "sup_partner": "cat_partner",
        "sup_safety": "cat_safety",
        "sup_trading": "cat_trading",
        "sup_vip": "cat_vip"
    }
    
    key = cat_map_keys.get(callback.data, "cat_general")
    category_name = get_msg(lang, key)
    
    user_id = str(callback.from_user.id)
    
    # Get initial instructions (checklists) from fallback library
    # Note: support_service.FALLBACK_INSTRUCTIONS might need localization too, 
    # but for now we focus on the wrappers.
    # We will just use the English key for looking up instructions for now as a fallback
    cat_map_en = {
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
    category_name_en = cat_map_en.get(callback.data, "General")
    
    instructions = support_service.FALLBACK_INSTRUCTIONS.get(category_name_en, ["Please describe your issue."])
    instr_text = "\n".join([f"• {i}" for i in instructions])
    
    await callback.message.edit_text(
        get_msg(lang, "support_category_details", category_name=category_name, instr_text=instr_text),
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

@dp.message(Command("pro", "upgrade", "elite"))
async def cmd_buy_pro(message: types.Message):
    """Direct command to open PRO upgrade flow."""
    await handle_buy_pro(message)

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

            lang = partner.language_code or ("ru" if message.from_user.language_code == "ru" else "en")

            if partner.is_pro:
                await message.answer(get_msg(lang, "already_pro"))
                return

            # Create payment session
            payment_data = await payment_service.create_payment_session(session, partner.id)
            amount = payment_data.get('amount')
            address = payment_data.get('address')

            if not amount or not address:
                raise ValueError("Incomplete payment session data")

            text = get_msg(lang, "upgrade_pro_details", amount=amount)

            # Send the address as a separate message for easy copying, or just include in code block
            text += f"\n\n`{address}`"

            await message.answer(
                text,
                parse_mode="Markdown",
                reply_markup=get_pro_payment_keyboard(address, amount, lang=lang)
            )
            break
    except Exception as e:
        logging.error(f"Error in handle_buy_pro: {e}")
        sentry_sdk.capture_exception(e)
        lang = "en" # fallback
        if message.from_user.language_code == "ru": lang = "ru"
        await message.answer(get_msg(lang, "session_creation_error"))

@dp.callback_query(F.data == "verify_pro_payment")
async def callback_verify_pro(callback: types.CallbackQuery):

    # Ask for TX hash
    # Ask for TX hash
    lang = "ru" if callback.from_user.language_code == "ru" else "en"
    
    await callback.message.answer(
        get_msg(lang, "verify_pro_step"),
        parse_mode="Markdown"
    )
    await callback.answer()

@dp.message(F.text.regexp(r'^[a-fA-F0-9]{64}$|^[a-zA-Z0-9+/]{43,44}=*$')) # Support Hex and Base64 TON hashes
async def handle_tx_hash(message: types.Message):
    from app.core.keyboards import get_main_menu_keyboard
    from app.services.partner_service import get_partner_by_telegram_id
    from app.services.payment_service import payment_service

    tx_hash = message.text.strip()
    
    # Tentative lang detection before we have partner
    lang = "ru" if message.from_user.language_code == "ru" else "en"
    
    wait_msg = await message.answer(get_msg(lang, "verifying_transaction"))

    try:
        async for session in get_session():
            partner = await get_partner_by_telegram_id(session, str(message.from_user.id))
            if not partner: return
            
            lang = partner.language_code or lang

            success = await payment_service.verify_ton_transaction(session, partner, tx_hash)

            if success:
                await wait_msg.edit_text(
                    get_msg(lang, "welcome_pro_verified"),
                    parse_mode="Markdown"
                )
                # Show main menu again with new status
                bot_info = await bot.get_me()
                referral_link = f"https://t.me/{bot_info.username}?start={partner.referral_code}"
                share_text = get_msg(partner.language_code or "en", "share_text")
                share_url = f"https://t.me/share/url?url={urllib.parse.quote(referral_link)}&text={urllib.parse.quote(share_text)}"

                await message.answer(
                    get_msg(lang, "what_next"),
                    reply_markup=get_main_menu_keyboard(WEB_APP_URL, share_url, referral_code=partner.referral_code, lang=lang)
                )

            else:
                await wait_msg.edit_text(
                    get_msg(lang, "verification_failed"),
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardBuilder().row(
                        types.InlineKeyboardButton(text=get_msg(lang, "btn_try_again"), callback_data="buy_pro")
                    ).as_markup()
                )
            break
    except Exception as e:
        logging.error(f"Error in handle_tx_hash: {e}")
        sentry_sdk.capture_exception(e)
        await wait_msg.edit_text(get_msg(lang, "verification_error"))

@dp.callback_query(F.data == "cancel_payment")
async def callback_cancel_payment(callback: types.CallbackQuery):
    lang = "ru" if callback.from_user.language_code == "ru" else "en"
    await callback.message.edit_text(get_msg(lang, "payment_cancelled"))
    await callback.answer()

@dp.message(F.text & ~F.text.startswith('/'))
async def handle_support_chat(message: types.Message):
    """
    Catch-all Support Chat handler.
    Natural language queries are routed to the AI Support Agent.
    """
    from app.services.partner_service import get_partner_by_telegram_id
    from app.services.support_service import support_service
    
    user_id = str(message.from_user.id)
    
    # Skip processing if it's a very short or junk message
    if len(message.text.strip()) < 2:
        return

    # Show typing indicator for a premium human-like feel
    with contextlib.suppress(Exception):
        await bot.send_chat_action(chat_id=message.chat.id, action="typing")
    
    try:
        async for session_db in get_session():
            partner = await get_partner_by_telegram_id(session_db, user_id)
            
            # Resume notifications if they were paused (user clearly unblocked bot)
            if partner and getattr(partner, "notifications_paused", False):
                partner.notifications_paused = False
                session_db.add(partner)
                await session_db.commit()
                # Clear Redis cache
                from app.services.rate_limit_service import rate_limit_service
                await rate_limit_service.unmark_user_blocked(int(user_id))
                logging.info(f"🔓 Resumed notifications for partner {partner.id} via support chat")
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
        sentry_sdk.capture_exception(e)
        lang = "en"
        if message.from_user.language_code == "ru": lang = "ru"
        await message.answer(get_msg(lang, "support_error"))
        

@dp.channel_post()
@dp.edited_channel_post()
async def handle_channel_post(message: types.Message):
    """
    Detects new or edited posts in partner channels and tracks them.
    """
    from datetime import UTC, datetime

    from sqlmodel import select

    from app.models.partner import SocialPost
    from app.services.partner_service import find_partner_by_channel
    from app.services.viral_analytics_service import viral_analytics

    # Extract channel identification (username or ID)
    channel_id = f"@{message.chat.username}" if message.chat.username else str(message.chat.id)
    
    try:
        async for session in get_session():
            partner = await find_partner_by_channel(session, channel_id)
            if not partner:
                # Small optimization: if no username, maybe it's the numeric ID that we have stored
                partner = await find_partner_by_channel(session, str(message.chat.id))
                if not partner:
                    return # Not a tracked channel

            # 1. Check if we already have this post
            stmt = select(SocialPost).where(
                SocialPost.platform == "telegram",
                SocialPost.external_id == str(message.message_id),
                SocialPost.channel_id == channel_id
            )
            res = await session.exec(stmt)
            post = res.first()

            if not post:
                # New post detected!
                post = SocialPost(
                    partner_id=partner.id,
                    platform="telegram",
                    external_id=str(message.message_id),
                    channel_id=channel_id,
                    created_at=datetime.now(UTC).replace(tzinfo=None)
                )
                session.add(post)
                await session.commit()
                await session.refresh(post)
                logging.info(f"📈 Started tracking new post {message.message_id} in {channel_id} (Partner: {partner.id})")
            
            # Trigger immediate metric scrape
            # This ensures even a "just posted" entry has a baseline (usually 0, but good for tracking)
            await viral_analytics.refresh_post_metrics(post.id, session)
            break
    except Exception as e:
        logging.error(f"❌ Error tracking channel post in {channel_id}: {e}")

async def main():
    logging.info("Starting bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())

# Deployment refresh: Tue Feb 10 23:32:50 CST 2026
