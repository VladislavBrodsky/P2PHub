
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
    {"first_name": "Noah 🇺🇸", "last_name": "Anderson", "username": "noah_nyc", "country": "US", "gender": "m"},
    {"first_name": "Emma 🇺🇸", "last_name": "Wilson", "username": "emma_cali", "country": "US", "gender": "f"},
    {"first_name": "Lucas 🇨🇦", "last_name": "Tremblay", "username": "lucas_to", "country": "CA", "gender": "m"},
    {"first_name": "Mia 🇦🇺", "last_name": "Taylor", "username": "mia_syd", "country": "AU", "gender": "f"},
    {"first_name": "Min-jun 🇰🇷", "last_name": "Kim", "username": "minjun_seo", "country": "KR", "gender": "m"},
    {"first_name": "Ji-won 🇰🇷", "last_name": "Park", "username": "jiwon_kr", "country": "KR", "gender": "f"},
    {"first_name": "Alejandro 🇦🇷", "last_name": "Gomez", "username": "ale_ba", "country": "AR", "gender": "m"},
    {"first_name": "Camila 🇦🇷", "last_name": "Perez", "username": "cami_ar", "country": "AR", "gender": "f"},
    {"first_name": "Nikolaj 🇩🇰", "last_name": "Jensen", "username": "nik_cph", "country": "DK", "gender": "m"},
    {"first_name": "Freja 🇩🇰", "last_name": "Nielsen", "username": "freja_dk", "country": "DK", "gender": "f"},
    {"first_name": "Mustafa 🇹🇷", "last_name": "Yilmaz", "username": "musti_ist", "country": "TR", "gender": "m"},
    {"first_name": "Zeynep 🇹🇷", "last_name": "Kaya", "username": "zeynep_tk", "country": "TR", "gender": "f"},
    {"first_name": "Kwame 🇬🇭", "last_name": "Mensah", "username": "kwame_gh", "country": "GH", "gender": "m"},
    {"first_name": "Efua 🇬🇭", "last_name": "Annan", "username": "efua_vibe", "country": "GH", "gender": "f"},
    {"first_name": "Sven 🇳🇴", "last_name": "Bakke", "username": "sven_oslo", "country": "NO", "gender": "m"},
    {"first_name": "Ingrid 🇳🇴", "last_name": "Larsen", "username": "ingrid_no", "country": "NO", "gender": "f"},
    {"first_name": "Piotr 🇵🇱", "last_name": "Wojcik", "username": "piotr_waw", "country": "PL", "gender": "m"},
    {"first_name": "Kasia 🇵🇱", "last_name": "Kowalska", "username": "kasia_pl", "country": "PL", "gender": "f"},
    {"first_name": "Oleksandr 🇺🇦", "last_name": "Shevchenko", "username": "olex_ua", "country": "UA", "gender": "m"},
    {"first_name": "Olena 🇺🇦", "last_name": "Bondarenko", "username": "olena_kyiv", "country": "UA", "gender": "f"},
    {"first_name": "Ahmed 🇪🇬", "last_name": "Hassan", "username": "ahmed_cairo", "country": "EG", "gender": "m"},
    {"first_name": "Layla 🇪🇬", "last_name": "Mahmoud", "username": "layla_eg", "country": "EG", "gender": "f"},
    {"first_name": "Jari 🇫🇮", "last_name": "Korhonen", "username": "jari_fin", "country": "FI", "gender": "m"},
    {"first_name": "Aino 🇫🇮", "last_name": "Maki", "username": "aino_hel", "country": "FI", "gender": "f"},
    {"first_name": "Thabo 🇿🇦", "last_name": "Molefe", "username": "thabo_sa", "country": "ZA", "gender": "m"},
    {"first_name": "Zanele 🇿🇦", "last_name": "Dlamini", "username": "zanele_dbn", "country": "ZA", "gender": "f"},
    {"first_name": "Daan 🇳🇱", "last_name": "De Jong", "username": "daan_ams", "country": "NL", "gender": "m"},
    {"first_name": "Lotte 🇳🇱", "last_name": "Visser", "username": "lotte_nl", "country": "NL", "gender": "f"},
    {"first_name": "Tiago 🇵🇹", "last_name": "Santos", "username": "tiago_lis", "country": "PT", "gender": "m"},
    {"first_name": "Beatriz 🇵🇹", "last_name": "Ferreira", "username": "bea_pt", "country": "PT", "gender": "f"},
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
    "IT": ["/avatars/it_f_1.webp"],
    "US": ["/avatars/us_m_1.webp", "/avatars/us_f_1.webp"],
    "CA": ["/avatars/ca_m_1.webp"]
}

# Generic fallback pool for variety
DEFAULT_AVATARS = [
    "/avatars/m1.webp", "/avatars/m2.webp", "/avatars/m3.webp", "/avatars/m4.webp",
    "/avatars/f1.webp", "/avatars/f2.webp", "/avatars/f3.webp"
]

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

            # Shuffle names to ensure unique distribution
            available_identities = list(NAMES_DATA)
            random.shuffle(available_identities)

            for i, p in enumerate(partners):
                # Pick a unique identity if pool allows
                if i < len(available_identities):
                    identity = available_identities[i]
                else:
                    identity = random.choice(NAMES_DATA)

                # Update attributes
                p.first_name = identity["first_name"]
                p.last_name = identity["last_name"]
                # Append a slightly longer random number for extra uniqueness
                p.username = f"{identity['username']}_{random.randint(1000, 9999)}"

                # Match country avatar or fallback
                country_code = identity.get("country", "RU")
                gender = identity.get("gender", "m")
                
                # Try to match gender from default avatars if generic
                country_avatars = AVATARS.get(country_code)
                if country_avatars:
                    p.photo_url = random.choice(country_avatars)
                else:
                    # Fallback to gender-filtered generic avatars
                    generic_pool = [a for a in DEFAULT_AVATARS if (gender == 'm' and '/m' in a) or (gender == 'f' and '/f' in a)]
                    p.photo_url = random.choice(generic_pool if generic_pool else DEFAULT_AVATARS)

                session.add(p)
                print(f"Updated ID {p.id}: {p.first_name} (@{p.username})")

            await session.commit()
            print("Successfully globalized all test users!")

    except Exception as e:
        print(f"Error during globalization: {e}")

if __name__ == "__main__":
    asyncio.run(main())
