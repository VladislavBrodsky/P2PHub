
import asyncio
import os
import random

# Set PYTHONPATH to include backend
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Hardcode env vars for script
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

from sqlmodel import select

from app.models.partner import Partner

# Diverse names data
# Diverse names data
NAMES_DATA = [
    {"first_name": "Dmitri 🇷🇺", "last_name": "Ivanov", "username": "dmitri_iv", "country": "RU", "gender": "m"},
    {"first_name": "Siddharth 🇮🇳", "last_name": "Sharma", "username": "sid_india", "country": "IN", "gender": "m"},
    {"first_name": "Isabella 🇧🇷", "last_name": "Silva", "username": "bella_rio", "country": "BR", "gender": "f"},
    {"first_name": "Yuki 🇯🇵", "last_name": "Tanaka", "username": "yuki_tk", "country": "JP", "gender": "f"},
    {"first_name": "Chinonso 🇳🇬", "last_name": "Okonkwo", "username": "chi_vibe", "country": "NG", "gender": "m"},
    {"first_name": "Mateo 🇪🇸", "last_name": "Garcia", "username": "mateo_esp", "country": "ES", "gender": "m"},
    {"first_name": "Elena 🇷🇺", "last_name": "Petrova", "username": "elena_p", "country": "RU", "gender": "f"},
    {"first_name": "Liam 🇮🇪", "last_name": "O'Sullivan", "username": "liam_dublin", "country": "IE", "gender": "m"},
    {"first_name": "Amina 🇦🇪", "last_name": "Mansour", "username": "amina_dxb", "country": "AE", "gender": "f"},
    {"first_name": "Arjun 🇮🇳", "last_name": "Patel", "username": "arjun_web3", "country": "IN", "gender": "m"},
    {"first_name": "Chloe 🇫🇷", "last_name": "Lefebvre", "username": "chloe_paris", "country": "FR", "gender": "f"},
    {"first_name": "Hans 🇩🇪", "last_name": "Müller", "username": "hans_berlin", "country": "DE", "gender": "m"},
    {"first_name": "Sofia 🇮🇹", "last_name": "Rossi", "username": "sofia_roma", "country": "IT", "gender": "f"},
    {"first_name": "Zhu 🇨🇳", "last_name": "Wei", "username": "zhu_wei", "country": "CN", "gender": "f"},
    {"first_name": "Santiago 🇲🇽", "last_name": "Hernandez", "username": "santi_mx", "country": "MX", "gender": "m"},
    {"first_name": "Aarav 🇮🇳", "last_name": "Kumar", "username": "aarav_k", "country": "IN", "gender": "m"},
    {"first_name": "Fatima 🇲🇦", "last_name": "Zahra", "username": "fatima_z", "country": "MA", "gender": "f"},
    {"first_name": "Oliver 🇬🇧", "last_name": "Smith", "username": "ollie_uk", "country": "UK", "gender": "m"},
    {"first_name": "Isla 🏴󠁧󠁢󠁳󠁣󠁴󠁿", "last_name": "McGregor", "username": "isla_scot", "country": "UK", "gender": "f"},
    {"first_name": "Lars 🇸🇪", "last_name": "Svensson", "username": "lars_sw", "country": "SE", "gender": "m"},
]

AVATARS = {
    "RU": ["/avatars/ru_m_1.webp"],
    "IN": ["/avatars/in_m_1.webp"],
    "BR": ["/avatars/br_f_1.webp"],
    "JP": ["/avatars/jp_f_1.webp"],
    "NG": ["/avatars/ng_m_1.webp"],
    "ES": ["/avatars/es_m_1.webp"],
    "FR": ["/avatars/fr_f_1.webp"],
    "DE": ["/avatars/de_m_1.webp"],
    "AE": ["/avatars/ae_f_1.webp"],
    "IT": ["/avatars/it_f_1.webp"]
}

# Generic fallback
DEFAULT_AVATARS = ["/avatars/m1.webp", "/avatars/m2.webp", "/avatars/f1.webp", "/avatars/f2.webp"]

async def main():
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy.orm import sessionmaker
        from sqlmodel.ext.asyncio.session import AsyncSession

        db_url = os.environ["DATABASE_URL"]
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        engine = create_async_engine(db_url, echo=True, future=True)
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        async with async_session() as session:
            # Query all partners that look like test users or have "None" names
            statement = select(Partner).where(
                (Partner.first_name.like("TestUser%")) |
                (Partner.first_name.is_(None)) |
                (Partner.username.like("TestUser%")) |
                (Partner.photo_url.like("%dicebear%")) |
                (Partner.photo_url.like("/avatars/%")) # Force refresh to country-specific
            )
            result = await session.exec(statement)
            partners = result.all()

            print(f"Globalizing {len(partners)} partners...")

            for p in partners:
                # Pick a name and identity
                identity = random.choice(NAMES_DATA)

                # Update attributes
                p.first_name = identity["first_name"]
                p.last_name = identity["last_name"]
                # Append a small random number to username to keep it somewhat unique
                p.username = f"{identity['username']}_{random.randint(100, 999)}"

                # Match country avatar or fallback
                country_code = identity.get("country", "RU")
                country_avatars = AVATARS.get(country_code, DEFAULT_AVATARS)
                p.photo_url = random.choice(country_avatars)

                session.add(p)
                print(f"Updated ID {p.id}: {p.first_name} (@{p.username})")

            await session.commit()
            print("Successfully globalized all test users!")

    except Exception as e:
        print(f"Error during globalization: {e}")

if __name__ == "__main__":
    asyncio.run(main())
