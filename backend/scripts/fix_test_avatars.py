import asyncio
import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from dotenv import load_dotenv

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment before importing app modules
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from app.models.partner import Partner, engine

# Pravatar Seeds mapping for gender
# 1, 3, 4, 7, 8, 9, 11, 12, 14, 15, 17, 18, 20 are mostly male
# 2, 5, 6, 10, 13, 16, 19 are mostly female
MALE_SEEDS = [1, 3, 4, 7, 8, 9, 11, 12, 14, 15, 17, 18, 20, 32, 48, 52, 63, 64, 65, 66, 67, 68, 69, 70]
FEMALE_SEEDS = [2, 5, 6, 10, 13, 16, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 40, 41, 46, 47]

MALE_TEST_USERS = [
    'alex_crypto', 'dmitry_ton', 'maxim', 'andrey_eth', 'sergey_pro', 
    'ivan_investor', 'artur_hub', 'pavel_x', 'nikita_dev', 'vitaliy', 
    'den_rich', 'oleg_strategy', 'stas_zero', 'cryptowhale', 'stas'
]

FEMALE_TEST_USERS = [
    'sarah_web3', 'elena', 'julia_s', 'natasha', 'olga_k', 
    'marina_digital', 'svetlana', 'anna_slovo', 'katerina_m', 
    'alena_marketing', 'viktoria', 'sarah', 'jessica'
]

async def fix_avatars():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("🔍 Scanning for test users to fix avatars...")
        
        # Get all partners
        statement = select(Partner)
        result = await session.exec(statement)
        partners = result.all()
        
        updated_count = 0
        
        for p in partners:
            username = (p.username or "").lower()
            first_name = (p.first_name or "").lower()
            
            is_male = any(name in username or name in first_name for name in MALE_TEST_USERS)
            is_female = any(name in username or name in first_name for name in FEMALE_TEST_USERS)
            
            # If both match (e.g. "alexandra"), prioritize female or refine
            if is_male and is_female:
                # Refinement: if it's exactly one of the female ones
                if any(username == name for name in FEMALE_TEST_USERS):
                    is_male = False
            
            new_url = None
            if is_male:
                seed = MALE_SEEDS[p.id % len(MALE_SEEDS)]
                new_url = f"https://i.pravatar.cc/300?u={seed}"
                print(f"👨‍💼 Setting male avatar for @{p.username} ({p.first_name}) using seed {seed}")
            elif is_female:
                seed = FEMALE_SEEDS[p.id % len(FEMALE_SEEDS)]
                new_url = f"https://i.pravatar.cc/300?u={seed}"
                print(f"👩‍💼 Setting female avatar for @{p.username} ({p.first_name}) using seed {seed}")
            
            if new_url and p.photo_url != new_url:
                p.photo_url = new_url
                p.photo_file_id = None # Clear telegram file id to force use of photo_url
                session.add(p)
                updated_count += 1
        
        if updated_count > 0:
            await session.commit()
            print(f"✅ Successfully updated {updated_count} avatars!")
        else:
            print("✨ No avatars needed updating.")

if __name__ == "__main__":
    asyncio.run(fix_avatars())
