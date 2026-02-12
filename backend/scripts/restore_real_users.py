
import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models.partner import Partner

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL is not set!")
        return
        
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        print("=" * 70)
        print("🔍 SEARCHING FOR AFFECTED REAL USERS")
        print("=" * 70)
        
        # Strategy: Find users who have photo_file_id (real Telegram users)
        # AND have fake avatars (/avatars/) - these were wrongly modified
        statement = select(Partner).where(
            Partner.photo_file_id.isnot(None)
        ).order_by(Partner.xp.desc()).limit(100)
        
        result = await session.exec(statement)
        all_real_users = result.all()
        
        print(f"\nFound {len(all_real_users)} users with Telegram photos (real users)")
        print("\nChecking which ones were affected by the script...\n")
        
        affected_users = []
        
        # Crypto-themed names that I used in the script
        script_patterns = [
            "satoshi", "vitalik", "hodl", "moon", "defi", "alpha", "diamond",
            "crypto", "whale", "bull_run", "alexander volkov", "sarah jenkins",
            "wei chen", "sofia rossi", "trader_x", "profit_seeker", "chart_master",
            "pixelprefix", "glitch", "shadow", "neon", "eth_goddess", "solana_surfer",
            "web3_native", "zero_cool", "stop_loss", "green_candle", "fud_buster"
        ]
        
        for user in all_real_users:
            is_affected = False
            reasons = []
            
            # Check if has fake avatar
            if user.photo_url and "/avatars/" in user.photo_url:
                is_affected = True
                reasons.append(f"Fake avatar: {user.photo_url}")
            
            # Check if username matches script patterns
            if user.username:
                username_lower = user.username.lower()
                for pattern in script_patterns:
                    if pattern in username_lower:
                        is_affected = True
                        reasons.append(f"Script-generated username pattern: {pattern}")
                        break
            
            # Check if first_name matches script patterns
            if user.first_name:
                name_lower = user.first_name.lower()
                for pattern in script_patterns:
                    if pattern in name_lower:
                        is_affected = True
                        reasons.append(f"Script-generated name pattern: {pattern}")
                        break
            
            if is_affected:
                affected_users.append({
                    'user': user,
                    'reasons': reasons
                })
        
        print(f"📊 SUMMARY: {len(affected_users)} real users were affected\n")
        
        if not affected_users:
            print("✅ No affected users found!")
            return
        
        print("=" * 70)
        print("AFFECTED USERS (sorted by XP):")
        print("=" * 70)
        
        for i, item in enumerate(affected_users, 1):
            user = item['user']
            reasons = item['reasons']
            
            print(f"\n{i}. User ID: {user.id} | Telegram ID: {user.telegram_id}")
            print(f"   Current Name: {user.first_name} {user.last_name or ''}")
            print(f"   Current Username: @{user.username}")
            print(f"   XP: {user.xp}")
            print(f"   Photo URL: {user.photo_url}")
            print(f"   Photo File ID: {user.photo_file_id[:20]}..." if user.photo_file_id else "   Photo File ID: None")
            print(f"   Reasons: {', '.join(reasons)}")
        
        print("\n" + "=" * 70)
        print("🔧 APPLYING FIXES...")
        print("=" * 70)
        
        fixed_count = 0
        
        for item in affected_users:
            user = item['user']
            
            # Fix 1: Clear fake avatar URL
            if user.photo_url and "/avatars/" in user.photo_url:
                print(f"\n🔄 User {user.id}: Clearing fake avatar {user.photo_url}")
                user.photo_url = None
                fixed_count += 1
            
            # Fix 2: For specific known users, restore original data
            # This requires manual mapping since we don't have the original data
            # The user should provide the correct names/usernames
            
            session.add(user)
        
        await session.commit()
        
        print("\n" + "=" * 70)
        print(f"✅ Fixed {fixed_count} users - cleared fake avatars")
        print("=" * 70)
        
        print("\n⚠️  IMPORTANT: Username and name restoration requires manual intervention")
        print("Please provide the correct names/usernames for the affected users above.")
        print("\nFor example:")
        print("  User ID X should be: 'Mikhail Kovshov' @mr_kovshov1")
        print("  User ID Y should be: 'Dmitry' @Rudskixx_Dmitry854")

if __name__ == "__main__":
    asyncio.run(main())
