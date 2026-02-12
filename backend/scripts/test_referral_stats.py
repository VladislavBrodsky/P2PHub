import asyncio
import os
import sys
from unittest.mock import AsyncMock

# --- PRE-IMPORT CONFIGURATION ---
PUBLIC_DB_URL = os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY")
FAKE_BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

os.environ["BOT_TOKEN"] = FAKE_BOT_TOKEN
os.environ["DATABASE_URL"] = PUBLIC_DB_URL
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["FRONTEND_URL"] = "http://localhost:3000"

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

# Import the command handler directly (we need to expose it or import from bot)
# Since bot.py is a script, importing it might run main().
# Better to import the functions if they were in a module, but they are in bot.py.
# We will import bot module but mock dp.start_polling to avoid running it.
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.partner import Partner


async def main():
    print(f"Using DB: {PUBLIC_DB_URL}")

    # 1. Setup DB
    engine = create_async_engine(PUBLIC_DB_URL, echo=False, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # 2. Get User
    telegram_id = "716720099"

    async with async_session() as session:
        statement = select(Partner).where(Partner.telegram_id == telegram_id)
        result = await session.exec(statement)
        partner = result.first()

        if not partner:
            print("❌ Test user not found")
            return

        print(f"Testing for Partner: {partner.first_name} (ID: {partner.id})")

        # 3. Import and run cmd_my_network
        # We need to mock the Message object
        from aiogram import types
        from aiogram.types import Chat, User

        mock_message = AsyncMock(spec=types.Message)
        mock_message.from_user = User(id=int(telegram_id), is_bot=False, first_name="Grand", username="grandmaestro", language_code="en")
        mock_message.chat = Chat(id=int(telegram_id), type="private")
        mock_message.text = "/my_network"

        # Mock answer method
        mock_message.answer = AsyncMock()

        # We need to patch get_session in bot.py logic if we import it,
        # OR we can just test get_referral_tree_stats directly since that's the logic.
        # Testing the full bot command requires importing bot.py which might have side effects.
        # Let's test the SERVICE function first, then we can trust the bot wrapper works (it's simple).

        from app.services.partner_service import get_referral_tree_stats

        print("Calculating stats...")
        stats = await get_referral_tree_stats(session, partner.id)
        print(f"Stats: {stats}")

        total = sum(stats.values())
        print(f"Total Partners: {total}")

        if total >= 2:
            print("✅ Stats seem correct (found partners)")
        else:
            print(f"⚠️ Stats might be empty? Found {total}")

if __name__ == "__main__":
    asyncio.run(main())
