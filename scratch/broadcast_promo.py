import asyncio
import os
import sys
import logging
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from aiogram import Bot, types
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.exceptions import TelegramForbiddenError, TelegramRetryAfter

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Set database URL
DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

# Texts
TEXT_EN = (
    "🚀 *The crypto shift is here!*\n\n"
    "The volume of crypto payments has grown dramatically over the last 3 months. It's time to capture this trend!\n\n"
    "Share *Pintopay* with your community and start earning *up to 30%* of their total card spends.\n\n"
    "Open the app to grab your personal invite link and start scaling your network today!"
)

TEXT_RU = (
    "🚀 *Крипто-тренд набирает обороты!*\n\n"
    "Объем платежей в криптовалюте вырос на рекордные 180% за последние 3 месяца. Самое время поймать эту волну!\n\n"
    "Делитесь *Pintopay* со своим сообществом и зарабатывайте *до 30%* от всех их расходов по картам.\n\n"
    "Откройте приложение, скопируйте свою личную пригласительную ссылку и начните строить сеть прямо сейчас!"
)

async def run_broadcast():
    # Set sys.path so we can import app config
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    sys.path.append(os.path.join(project_root, "backend"))

    from app.core.config import settings
    from app.models.partner import Partner

    # Initialize Bot
    bot = Bot(token=settings.BOT_TOKEN)
    
    # Initialize DB Engine
    engine = create_async_engine(DATABASE_URL)
    async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # 1. Upload the promo photos to retrieve their Telegram file_ids
    # We send them to @uslincoln (TG: 716720099) who is active
    test_chat_id = 716720099
    logger.info(f"📤 Uploading English promo image to chat {test_chat_id}...")
    try:
        photo_en = types.FSInputFile("/Users/grandmaestro/.gemini/antigravity/brain/4cda3594-ae4e-43d0-8ce6-3e99078c80cc/promo_en_exact_1780688038836.png")
        res_en = await bot.send_photo(
            chat_id=test_chat_id,
            photo=photo_en,
            caption="Preview: English version uploaded successfully."
        )
        file_id_en = res_en.photo[-1].file_id
        logger.info(f"✅ English File ID: {file_id_en}")
    except Exception as e:
        logger.error(f"Failed to upload English photo: {e}")
        await engine.dispose()
        return

    logger.info(f"📤 Uploading Russian promo image to chat {test_chat_id}...")
    try:
        photo_ru = types.FSInputFile("/Users/grandmaestro/.gemini/antigravity/brain/4cda3594-ae4e-43d0-8ce6-3e99078c80cc/promo_ru_exact_1780688052516.png")
        res_ru = await bot.send_photo(
            chat_id=test_chat_id,
            photo=photo_ru,
            caption="Preview: Russian version uploaded successfully."
        )
        file_id_ru = res_ru.photo[-1].file_id
        logger.info(f"✅ Russian File ID: {file_id_ru}")
    except Exception as e:
        logger.error(f"Failed to upload Russian photo: {e}")
        await engine.dispose()
        return

    # Keyboard buttons
    web_app_url = "https://p2phub-production.up.railway.app" if "localhost" in settings.FRONTEND_URL else settings.FRONTEND_URL
    if not web_app_url.startswith("https://"):
        web_app_url = "https://p2phub-production.up.railway.app"

    keyboard_en = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🚀 OPEN P2PHUB", web_app=WebAppInfo(url=web_app_url))
    ]])

    keyboard_ru = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🚀 ОТКРЫТЬ P2PHUB", web_app=WebAppInfo(url=web_app_url))
    ]])

    # 2. Get list of all users from DB
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.notifications_paused == False)
        result = await session.exec(stmt)
        partners = result.all()

    total_partners = len(partners)
    logger.info(f"📢 Starting broadcast to {total_partners} active partners...")

    success_count = 0
    forbidden_count = 0
    error_count = 0

    for idx, p in enumerate(partners, 1):
        # Determine language, message text, photo file_id, and keyboard markup
        lang = p.language_code or "en"
        if lang == "ru":
            text = TEXT_RU
            photo_file_id = file_id_ru
            keyboard = keyboard_ru
        else:
            text = TEXT_EN
            photo_file_id = file_id_en
            keyboard = keyboard_en

        try:
            # We cast telegram_id to int
            chat_id = int(p.telegram_id)
        except Exception:
            logger.warning(f"Skip user with invalid telegram_id: {p.telegram_id}")
            error_count += 1
            continue

        # Skip testing on the user we already sent files to, so we don't spam him
        # But wait, we should send the actual styled message + buttons to him too!
        # Let's send it.

        retry_attempts = 3
        while retry_attempts > 0:
            try:
                await bot.send_photo(
                    chat_id=chat_id,
                    photo=photo_file_id,
                    caption=text,
                    parse_mode="Markdown",
                    reply_markup=keyboard
                )
                success_count += 1
                if idx % 20 == 0 or idx == total_partners:
                    logger.info(f"Progress: {idx}/{total_partners} sent. Success: {success_count}, Blocks: {forbidden_count}, Errors: {error_count}")
                break # Success, exit retry loop
            except TelegramRetryAfter as e:
                logger.warning(f"Rate limited. Waiting {e.retry_after}s to retry user {p.username or p.telegram_id}...")
                await asyncio.sleep(e.retry_after)
                retry_attempts -= 1
            except TelegramForbiddenError:
                logger.info(f"🚫 User {p.username or p.telegram_id} has blocked the bot.")
                forbidden_count += 1
                
                # Mark as paused in DB
                async with async_session_maker() as session:
                    p_db = await session.get(Partner, p.id)
                    if p_db:
                        p_db.notifications_paused = True
                        session.add(p_db)
                        await session.commit()
                break # Exit retry loop
            except Exception as e:
                logger.error(f"Failed to send to {p.username or p.telegram_id}: {e}")
                error_count += 1
                break # Exit retry loop

        # Respect Telegram limits: 30 messages/sec -> 33ms delay. We'll use 50ms for safety.
        await asyncio.sleep(0.05)

    logger.info("==================================================")
    logger.info("BROADCAST COMPLETED SUCCESSFULLY")
    logger.info(f"Total targeted: {total_partners}")
    logger.info(f"Successfully sent: {success_count}")
    logger.info(f"Blocked (marked paused): {forbidden_count}")
    logger.info(f"Errors/Failed: {error_count}")
    logger.info("==================================================")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_broadcast())
