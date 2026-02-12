
import asyncio
import os
import random

# Set PYTHONPATH to include backend
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Hardcode env vars for script
# Database configuration handled via environment variables

from sqlmodel import select

from app.models.partner import Partner

# Diverse names data
# Diverse names data
# Diverse names data
NAMES_DATA = [
    {"first_name": "Дмитрий", "last_name": "Иванов", "username": "dmitri_iv", "country": "RU", "gender": "m"},
    {"first_name": "Siddharth", "last_name": "Sharma", "username": "sid_india", "country": "IN", "gender": "m"},
    {"first_name": "Isabella", "last_name": "Silva", "username": "bella_rio", "country": "BR", "gender": "f"},
    {"first_name": "田中 結衣", "last_name": "", "username": "yuki_tk", "country": "JP", "gender": "f"},
    {"first_name": "Chinonso", "last_name": "Okonkwo", "username": "chi_vibe", "country": "NG", "gender": "m"},
    {"first_name": "Mateo", "last_name": "Garcia", "username": "mateo_esp", "country": "ES", "gender": "m"},
    {"first_name": "Елена", "last_name": "Петрова", "username": "elena_p", "country": "RU", "gender": "f"},
    {"first_name": "Liam", "last_name": "O'Sullivan", "username": "liam_dublin", "country": "IE", "gender": "m"},
    {"first_name": "Amina", "last_name": "Mansour", "username": "amina_dxb", "country": "AE", "gender": "f"},
    {"first_name": "Arjun", "last_name": "Patel", "username": "arjun_web3", "country": "IN", "gender": "m"},
    {"first_name": "Chloe", "last_name": "Lefebvre", "username": "chloe_paris", "country": "FR", "gender": "f"},
    {"first_name": "Hans", "last_name": "Müller", "username": "hans_berlin", "country": "DE", "gender": "m"},
    {"first_name": "Sofia", "last_name": "Rossi", "username": "sofia_roma", "country": "IT", "gender": "f"},
    {"first_name": "Wei Zhu", "last_name": "", "username": "zhu_wei", "country": "CN", "gender": "f"},
    {"first_name": "Santiago", "last_name": "Hernandez", "username": "santi_mx", "country": "MX", "gender": "m"},
    {"first_name": "Aarav", "last_name": "Kumar", "username": "aarav_k", "country": "IN", "gender": "m"},
    {"first_name": "Fatima", "last_name": "Zahra", "username": "fatima_z", "country": "MA", "gender": "f"},
    {"first_name": "Oliver", "last_name": "Smith", "username": "ollie_uk", "country": "UK", "gender": "m"},
    {"first_name": "Isla", "last_name": "McGregor", "username": "isla_scot", "country": "UK", "gender": "f"},
    {"first_name": "Lars", "last_name": "Svensson", "username": "lars_sw", "country": "SE", "gender": "m"},
    {"first_name": "Noah", "last_name": "Anderson", "username": "noah_nyc", "country": "US", "gender": "m"},
    {"first_name": "Emma", "last_name": "Wilson", "username": "emma_cali", "country": "US", "gender": "f"},
    {"first_name": "Lucas", "last_name": "Tremblay", "username": "lucas_to", "country": "CA", "gender": "m"},
    {"first_name": "Mia", "last_name": "Taylor", "username": "mia_syd", "country": "AU", "gender": "f"},
    {"first_name": "김민준", "last_name": "", "username": "minjun_seo", "country": "KR", "gender": "m"},
    {"first_name": "박지원", "last_name": "", "username": "jiwon_kr", "country": "KR", "gender": "f"},
    {"first_name": "Alejandro", "last_name": "Gomez", "username": "ale_ba", "country": "AR", "gender": "m"},
    {"first_name": "Camila", "last_name": "Perez", "username": "cami_ar", "country": "AR", "gender": "f"},
    {"first_name": "Nikolaj", "last_name": "Jensen", "username": "nik_cph", "country": "DK", "gender": "m"},
    {"first_name": "Freja", "last_name": "Nielsen", "username": "freja_dk", "country": "DK", "gender": "f"},
    {"first_name": "Mustafa", "last_name": "Yılmaz", "username": "musti_ist", "country": "TR", "gender": "m"},
    {"first_name": "Zeynep", "last_name": "Kaya", "username": "zeynep_tk", "country": "TR", "gender": "f"},
    {"first_name": "Kwame", "last_name": "Mensah", "username": "kwame_gh", "country": "GH", "gender": "m"},
    {"first_name": "Efua", "last_name": "Annan", "username": "efua_vibe", "country": "GH", "gender": "f"},
    {"first_name": "Sven", "last_name": "Bakke", "username": "sven_oslo", "country": "NO", "gender": "m"},
    {"first_name": "Ingrid", "last_name": "Larsen", "username": "ingrid_no", "country": "NO", "gender": "f"},
    {"first_name": "Piotr", "last_name": "Wojcik", "username": "piotr_waw", "country": "PL", "gender": "m"},
    {"first_name": "Kasia", "last_name": "Kowalska", "username": "kasia_pl", "country": "PL", "gender": "f"},
    {"first_name": "Oleksandr", "last_name": "Shevchenko", "username": "olex_ua", "country": "UA", "gender": "m"},
    {"first_name": "Olena", "last_name": "Bondarenko", "username": "olena_kyiv", "country": "UA", "gender": "f"},
    {"first_name": "Ahmed", "last_name": "Hassan", "username": "ahmed_cairo", "country": "EG", "gender": "m"},
    {"first_name": "Layla", "last_name": "Mahmoud", "username": "layla_eg", "country": "EG", "gender": "f"},
    {"first_name": "Jari", "last_name": "Korhonen", "username": "jari_fin", "country": "FI", "gender": "m"},
    {"first_name": "Aino", "last_name": "Maki", "username": "aino_hel", "country": "FI", "gender": "f"},
    {"first_name": "Thabo", "last_name": "Molefe", "username": "thabo_sa", "country": "ZA", "gender": "m"},
    {"first_name": "Zanele", "last_name": "Dlamini", "username": "zanele_dbn", "country": "ZA", "gender": "f"},
    {"first_name": "Daan", "last_name": "De Jong", "username": "daan_ams", "country": "NL", "gender": "m"},
    {"first_name": "Lotte", "last_name": "Visser", "username": "lotte_nl", "country": "NL", "gender": "f"},
    {"first_name": "Tiago", "last_name": "Santos", "username": "tiago_lis", "country": "PT", "gender": "m"},
    {"first_name": "Beatriz", "last_name": "Ferreira", "username": "bea_pt", "country": "PT", "gender": "f"},
    {"first_name": "佐藤 健三", "last_name": "", "username": "kenzo_tokyo", "country": "JP", "gender": "m"},
    {"first_name": "伊藤 さくら", "last_name": "", "username": "sakura_web3", "country": "JP", "gender": "f"},
    {"first_name": "Lars", "last_name": "Andersson", "username": "lars_sthlm", "country": "SE", "gender": "m"},
    {"first_name": "Astrid", "last_name": "Eriksson", "username": "astrid_se", "country": "SE", "gender": "f"},
    {"first_name": "Luca", "last_name": "Muller", "username": "luca_zug", "country": "CH", "gender": "m"},
    {"first_name": "Heidi", "last_name": "Weber", "username": "heidi_ch", "country": "CH", "gender": "f"},
    {"first_name": "Ravi", "last_name": "Gupta", "username": "ravi_crypto", "country": "IN", "gender": "m"},
    {"first_name": "Ananya", "last_name": "Iyer", "username": "ananya_in", "country": "IN", "gender": "f"},
    {"first_name": "Carlos", "last_name": "Rodriguez", "username": "carlos_med", "country": "CO", "gender": "m"},
    {"first_name": "Sofia", "last_name": "Lopez", "username": "sofia_co", "country": "CO", "gender": "f"},
    {"first_name": "Stefan", "last_name": "Hofer", "username": "stefan_vienna", "country": "AT", "gender": "m"},
    {"first_name": "Lara", "last_name": "Steiner", "username": "lara_at", "country": "AT", "gender": "f"},
    {"first_name": "Yassin", "last_name": "Alaoui", "username": "yassin_casa", "country": "MA", "gender": "m"},
    {"first_name": "Salma", "last_name": "Fassi", "username": "salma_ma", "country": "MA", "gender": "f"},
    {"first_name": "Hugo", "last_name": "Peeters", "username": "hugo_brux", "country": "BE", "gender": "m"},
    {"first_name": "Amelie", "last_name": "Leclerc", "username": "amelie_be", "country": "BE", "gender": "f"},
    {"first_name": "Ivan", "last_name": "Horvat", "username": "ivan_zg", "country": "HR", "gender": "m"},
    {"first_name": "Marija", "last_name": "Kovac", "username": "marija_hr", "country": "HR", "gender": "f"},
    {"first_name": "Tariq", "last_name": "Al-Fahd", "username": "tariq_ruh", "country": "SA", "gender": "m"},
    {"first_name": "Noora", "last_name": "Salem", "username": "noora_jed", "country": "SA", "gender": "f"},
    {"first_name": "Andrei", "last_name": "Popa", "username": "andrei_buc", "country": "RO", "gender": "m"},
    {"first_name": "Elena", "last_name": "Radu", "username": "elena_ro", "country": "RO", "gender": "f"},
    {"first_name": "Søren", "last_name": "Joensen", "username": "soren_faroe", "country": "DK", "gender": "m"},
    {"first_name": "Daria", "last_name": "Nowak", "username": "daria_pl", "country": "PL", "gender": "f"},
    {"first_name": "Marek", "last_name": "Svoboda", "username": "marek_prg", "country": "CZ", "gender": "m"},
    {"first_name": "Adela", "last_name": "Novotna", "username": "adela_cz", "country": "CZ", "gender": "f"},
    {"first_name": "Niklas", "last_name": "Virtanen", "username": "niklas_hel", "country": "FI", "gender": "m"},
    {"first_name": "Silva", "last_name": "Papadopoulos", "username": "silva_ath", "country": "GR", "gender": "m"},
    {"first_name": "Eleni", "last_name": "Kostas", "username": "eleni_gr", "country": "GR", "gender": "f"},
    {"first_name": "Femi", "last_name": "Adeyemi", "username": "femi_abuja", "country": "NG", "gender": "m"},
    {"first_name": "Tolu", "last_name": "Ojo", "username": "tolu_lag", "country": "NG", "gender": "f"},
    {"first_name": "Marc", "last_name": "Schmit", "username": "marc_lux", "country": "LU", "gender": "m"},
    {"first_name": "Sven", "last_name": "Gunnarsson", "username": "sven_rek", "country": "IS", "gender": "m"},
    {"first_name": "Erika", "last_name": "Nagy", "username": "erika_bud", "country": "HU", "gender": "f"},
    {"first_name": "Viktor", "last_name": "Kovac", "username": "viktor_sk", "country": "SK", "gender": "m"},
]

AVATARS = {
    "RU": ["/avatars/ru_m_1.webp", "/avatars/portrait_ru_m_1.webp"],
    "IN": ["/avatars/in_m_1.webp"],
    "BR": ["/avatars/br_f_1.webp", "/avatars/portrait_br_f_2.webp"],
    "JP": ["/avatars/jp_f_1.webp", "/avatars/portrait_jp_f_1.webp"],
    "NG": ["/avatars/ng_m_1.webp"],
    "ES": ["/avatars/es_m_1.webp"],
    "FR": ["/avatars/fr_f_1.webp"],
    "DE": ["/avatars/de_m_1.webp"],
    "AE": ["/avatars/ae_f_1.webp"],
    "IT": ["/avatars/it_f_1.webp"],
    "US": ["/avatars/us_m_1.webp", "/avatars/us_f_1.webp"],
    "CA": ["/avatars/ca_m_1.webp"],
    "TR": ["/avatars/portrait_tr_m_1.webp"],
    "KR": ["/avatars/portrait_kr_f_2.webp"]
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
            # Query all partners that look like test users or have "None" names
            # Query all partners that look like test users or have "None" names
            statement = select(Partner).where(
                (Partner.first_name.like("TestUser%")) |
                (Partner.first_name.like("SimUser%")) |
                (Partner.first_name.like("ChainUser%")) |
                (Partner.first_name.like("User %")) |
                (Partner.first_name.like("Test User%")) |
                (Partner.first_name.like("%|%")) |
                (Partner.first_name.is_(None)) |
                (Partner.username.like("TestUser%")) |
                (Partner.username.like("SimUser%")) |
                (Partner.username.like("ChainUser%")) |
                (Partner.username.like("User %")) |
                (Partner.photo_url.like("%dicebear%")) |
                (Partner.photo_url.like("/avatars/%")) | 
                (Partner.photo_url.is_(None))
            ).order_by(Partner.xp.desc()) # Prioritize top rankers for unique avatars

            result = await session.exec(statement)
            partners = result.all()
            
            print(f"Globalizing {len(partners)} partners...")

            # Shuffle names to ensure unique distribution
            available_identities = list(NAMES_DATA)
            random.shuffle(available_identities)

            # Web3 flavor text
            CRYPTO_SUFFIXES = ["_eth", "_btc", "_sol", "_nft", "_dao", "_defi", "_web3", "_hodl", "_gm", "_wagmi", "_alpha", "_degne"]

            # Comprehensive Avatar Pools
            MALE_POOL = [
                "/avatars/m1.webp", "/avatars/m2.webp", "/avatars/m3.webp", "/avatars/m4.webp",
                "/avatars/us_m_1.webp", "/avatars/ca_m_1.webp", "/avatars/de_m_1.webp",
                "/avatars/es_m_1.webp", "/avatars/in_m_1.webp", "/avatars/ng_m_1.webp", 
                "/avatars/ru_m_1.webp", "/avatars/portrait_ru_m_1.webp", "/avatars/portrait_tr_m_1.webp"
            ]
            FEMALE_POOL = [
                "/avatars/f1.webp", "/avatars/f2.webp", "/avatars/f3.webp",
                "/avatars/us_f_1.webp", "/avatars/ae_f_1.webp", "/avatars/br_f_1.webp",
                "/avatars/fr_f_1.webp", "/avatars/it_f_1.webp", "/avatars/jp_f_1.webp",
                "/avatars/portrait_jp_f_1.webp", "/avatars/portrait_br_f_2.webp", "/avatars/portrait_kr_f_2.webp"
            ]

            # Track usage to ensure uniqueness for top users
            used_avatars = set()
            last_assigned_avatar = None # To prevent adjacent duplicates

            FLAGS = {
                "RU": "🇷🇺", "IN": "🇮🇳", "BR": "🇧🇷", "JP": "🇯🇵", "NG": "🇳🇬", "ES": "🇪🇸",
                "FR": "🇫🇷", "DE": "🇩🇪", "AE": "🇦🇪", "IT": "🇮🇹", "US": "🇺🇸", "CA": "🇨🇦",
                "TR": "🇹🇷", "KR": "🇰🇷", "CN": "🇨🇳", "MX": "🇲🇽", "UK": "🇬🇧", "SE": "🇸🇪",
                "AU": "🇦🇺", "AR": "🇦🇷", "DK": "🇩🇰", "GH": "🇬🇭", "NO": "🇳🇴", "PL": "🇵🇱",
                "UA": "🇺🇦", "EG": "🇪🇬", "FI": "🇫🇮", "ZA": "🇿🇦", "NL": "🇳🇱", "PT": "🇵🇹",
                "CH": "🇨🇭", "AT": "🇦🇹", "MA": "🇲🇦", "BE": "🇧🇪", "HR": "🇭🇷", "SA": "🇸🇦",
                "RO": "🇷🇴", "CZ": "🇨🇿", "GR": "🇬🇷", "LU": "🇱🇺", "IS": "🇮🇸", "HU": "🇭🇺",
                "SK": "🇸🇰", "IE": "🇮🇪"
            }

            for i, p in enumerate(partners):
                # Pick a unique identity if pool allows
                if i < len(available_identities):
                    identity = available_identities[i]
                else:
                    identity = random.choice(NAMES_DATA)

                # Determine if we should add a flag (Top 3 only)
                country_code = identity.get("country", "RU")
                flag = FLAGS.get(country_code, "") if i < 3 else ""

                # Update attributes
                p.first_name = f"{identity['first_name']} {flag}".strip()
                p.last_name = identity["last_name"]
                
                # Create a Web3 style username
                base_username = identity['username'].split('_')[0] 
                suffix = random.choice(CRYPTO_SUFFIXES) if random.random() > 0.3 else ""
                p.username = f"{base_username}{suffix}_{random.randint(100, 9999)}"

                # Match country avatar or fallback
                gender = identity.get("gender", "m")
                
                # Determine candidate pool
                pool = MALE_POOL if gender == 'm' else FEMALE_POOL
                
                # 1. Try strict country match first
                country_avatars = AVATARS.get(country_code)
                selected_avatar = None
                
                if country_avatars:
                    for av in country_avatars:
                        if av not in used_avatars:
                           selected_avatar = av
                           break
                    if not selected_avatar: selected_avatar = random.choice(country_avatars) # Re-use if specific match exhausted

                # 2. If no specific match or we want to prioritize uniqueness for top ranks
                # (For top 20, force unique from general pool if specific is taken/unavailable)
                if not selected_avatar:
                    # Try to find an unused avatar from the general gender pool
                    available_in_pool = [a for a in pool if a not in used_avatars]
                    if available_in_pool:
                        selected_avatar = random.choice(available_in_pool)
                    else:
                        # Pool exhausted, must reuse.
                        # Filter out the LAST assigned avatar to prevent adjacent duplicates
                        choices = [a for a in pool if a != last_assigned_avatar]
                        if not choices: choices = pool # Should not happen unless pool size is 1
                        selected_avatar = random.choice(choices)

                # Assign and track
                p.photo_url = selected_avatar
                used_avatars.add(selected_avatar)
                last_assigned_avatar = selected_avatar

            await session.commit()
            print("Successfully globalized all test users!")

    except Exception as e:
        print(f"Error during globalization: {e}")

if __name__ == "__main__":
    asyncio.run(main())
