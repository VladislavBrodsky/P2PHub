import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from dotenv import load_dotenv
import os

# Load .env explicitly
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

# Get DATABASE_URL from environment
db_url = os.getenv("DATABASE_URL", os.getenv("DATABASE_URL", "REMOVED_FOR_SECURITY"))

# Ensure async driver
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

print(f"Connecting to: {db_url.split('@')[-1]}")  # Mask credentials

# Import Partner model - need to do this after connection setup
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Create engine and session factory
engine = create_async_engine(db_url, echo=False)
async_session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Define Partner model inline to avoid import issues
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime as dt

Base = declarative_base()

class PartnerSimple(Base):
    __tablename__ = 'partner'
    
    id = Column(Integer, primary_key=True)
    telegram_id = Column(String)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    referrer_id = Column(Integer, nullable=True)
    path = Column(Text, nullable=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    is_pro = Column(Boolean, default=False)
    language_code = Column(String, default='en')
    created_at = Column(DateTime, default=dt.utcnow)
    referral_count = Column(Integer, default=0)


async def check_recent_users():
    """Check the last users who joined the bot"""
    print("=" * 70)
    print("🔍 CHECKING RECENT USERS AND REFERRAL NOTIFICATION SYSTEM")
    print("=" * 70)
    
    async with async_session_factory() as session:
        # Get the last 10 users who joined
        from sqlalchemy import text
        
        result = await session.execute(text("""
            SELECT id, telegram_id, username, first_name, last_name, 
                   referrer_id, path, xp, level, is_pro, created_at, referral_count
            FROM partner 
            ORDER BY created_at DESC 
            LIMIT 10
        """))
        recent_users = result.fetchall()
        
        print(f"\n📊 Last {len(recent_users)} users who joined the bot:\n")
        print(f"{'ID':<6} {'Username':<20} {'Name':<25} {'Referrer ID':<12} {'Created At':<20} {'Path'}")
        print("-" * 120)
        
        for user in recent_users:
            user_id, telegram_id, username, first_name, last_name, referrer_id, path, xp, level, is_pro, created_at, referral_count = user
            username_str = f"@{username}" if username else "N/A"
            name = f"{first_name or ''} {last_name or ''}".strip() or "N/A"
            referrer = str(referrer_id) if referrer_id else "None"
            created = created_at.strftime("%Y-%m-%d %H:%M:%S") if created_at else "N/A"
            path_str = path or "Root"
            
            print(f"{user_id:<6} {username_str:<20} {name:<25} {referrer:<12} {created:<20} {path_str[:40]}")
        
        # Check referral tree for users with referrers
        print("\n" + "=" * 70)
        print("🔗 REFERRAL TREE VERIFICATION")
        print("=" * 70)
        
        for user in recent_users[:5]:  # Check first 5 users
            user_id, telegram_id, username, first_name, last_name, referrer_id, path, xp, level, is_pro, created_at, referral_count = user
            
            if not referrer_id:
                print(f"\n👤 User {user_id} (@{username}) - ROOT USER (no referrer)")
                continue
                
            print(f"\n👤 User {user_id} (@{username}) - Joined: {created_at}")
            print(f"   Referrer ID: {referrer_id}")
            print(f"   Path: {path}")
            
            # Reconstruct lineage
            if path:
                lineage_ids = [int(x) for x in path.split('.')]
                lineage_ids = lineage_ids[-9:]  # Last 9 levels
                
                print(f"   Lineage ({len(lineage_ids)} levels): {lineage_ids}")
                
                # Fetch all ancestors
                ancestor_result = await session.execute(
                    text(f"SELECT id, username, xp, is_pro, referrer_id FROM partner WHERE id IN ({','.join(map(str, lineage_ids))})")
                )
                ancestors = {row[0]: row for row in ancestor_result.fetchall()}
                
                # Display the referral tree
                current_referrer_id = referrer_id
                for lvl in range(1, 10):
                    if not current_referrer_id:
                        break
                    
                    referrer = ancestors.get(current_referrer_id)
                    if not referrer:
                        print(f"   ⚠️  Level {lvl}: Ancestor {current_referrer_id} NOT FOUND")
                        break
                    
                    ref_id, ref_username, ref_xp, ref_is_pro, ref_referrer_id = referrer
                    
                    # Calculate XP that should have been awarded
                    XP_MAP = {1: 35, 2: 10, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1}
                    xp_gain = XP_MAP.get(lvl, 0)
                    if ref_is_pro:
                        xp_gain *= 3  # PRO members get 3x XP bonus
                    
                    status = "✅"
                    pro_indicator = "🌟 PRO" if ref_is_pro else ""
                    print(f"   {status} Level {lvl}: {ref_id} (@{ref_username}) - XP: {ref_xp} {pro_indicator} (Should receive: +{xp_gain} XP)")
                    
                    current_referrer_id = ref_referrer_id
        
        # Check for users who should have received notifications
        print("\n" + "=" * 70)
        print("📬 NOTIFICATION SYSTEM VERIFICATION")
        print("=" * 70)
        
        # Users with referrals in the last 24 hours
        result_refs = await session.execute(text("""
            SELECT id, telegram_id, username, first_name, referrer_id, path, created_at
            FROM partner 
            WHERE referrer_id IS NOT NULL 
            AND created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
        """))
        recent_referrals = result_refs.fetchall()
        
        print(f"\n📊 {len(recent_referrals)} referrals in the last 24 hours")
        
        if recent_referrals:
            print("\nNotifications that should have been sent:")
            for ref in recent_referrals[:5]:
                ref_id, ref_telegram_id, ref_username, ref_first_name, ref_referrer_id, ref_path, ref_created = ref
                print(f"\n   New user: {ref_id} (@{ref_username}) - Joined: {ref_created}")
                
                if ref_path:
                    lineage_ids = [int(x) for x in ref_path.split('.')][-9:]
                    notified_result = await session.execute(
                        text(f"SELECT id, username FROM partner WHERE id IN ({','.join(map(str, lineage_ids))})")
                    )
                    notified_users = {row[0]: row for row in notified_result.fetchall()}
                    
                    current_ref_id = ref_referrer_id
                    for lvl in range(1, min(len(lineage_ids) + 1, 10)):
                        if not current_ref_id:
                            break
                        ancestor = notified_users.get(current_ref_id)
                        if ancestor:
                            anc_id, anc_username = ancestor  
                            msg_type = "Direct Referral (L1)" if lvl== 1 else f"Deep Referral (L{lvl})"
                            print(f"      📧 {msg_type} notification → {anc_id} (@{anc_username})")
                            # Get next referrer
                            next_ref_result = await session.execute(
                                text(f"SELECT referrer_id FROM partner WHERE id = {current_ref_id}")
                            )
                            next_ref_row = next_ref_result.fetchone()
                            current_ref_id = next_ref_row[0] if next_ref_row else None
        
        print("\n" + "=" * 70)
        print("✅ VERIFICATION COMPLETE")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(check_recent_users())
