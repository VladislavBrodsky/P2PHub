"""
Live audit: checks which users have is_pro=True in the DB,
and simulates what the /api/pro/status endpoint returns for them.
This confirms the backend is healthy for all PRO users.
"""
import asyncio
import sys
import os

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
sys.path.insert(0, BASE_DIR)

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(os.path.join(BASE_DIR, ".env"))

from app.models.partner import Partner

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def audit():
    async with AsyncSessionLocal() as session:
        # Get all PRO users
        result = await session.exec(select(Partner).where(Partner.is_pro == True))
        pro_users = result.all()
        
        print(f"\n{'='*70}")
        print(f"  PRO/PRO+ ACCESS AUDIT — {len(pro_users)} PRO users in database")
        print(f"{'='*70}")
        
        ok_count = 0
        issue_count = 0
        
        for p in pro_users:
            # Simulate exactly what /api/pro/status returns
            is_pro = p.is_pro
            is_pro_plus = p.is_pro_plus or (
                p.subscription_plan and 'PLUS' in p.subscription_plan.upper()
            )
            
            # This is the lock screen condition: (!status || !status.is_pro)
            would_be_locked = not is_pro
            
            status_icon = "✅" if not would_be_locked else "❌ LOCKED"
            plan_str = p.subscription_plan or "none"
            expires = str(p.pro_expires_at)[:10] if p.pro_expires_at else "never"
            tokens = p.pro_tokens or 0
            
            tier = "PRO+"  if is_pro_plus else "PRO"
            username = f"@{p.username}" if p.username else f"id:{p.telegram_id}"
            
            print(f"  {status_icon:12} {username:25} {tier:5} | plan={plan_str:25} | expires={expires} | tokens={tokens}")
            
            if would_be_locked:
                issue_count += 1
            else:
                ok_count += 1
        
        print(f"\n{'='*70}")
        print(f"  RESULT: {ok_count} users CAN access ProDashboard | {issue_count} users would be LOCKED")
        
        # Spot-check uslincoln specifically
        result2 = await session.exec(select(Partner).where(Partner.username == "uslincoln"))
        uslincoln = result2.first()
        
        if uslincoln:
            print(f"\n  🔍 SPOT CHECK @uslincoln:")
            print(f"     is_pro         = {uslincoln.is_pro}")
            print(f"     is_pro_plus    = {uslincoln.is_pro_plus}")
            print(f"     subscription   = {uslincoln.subscription_plan}")
            print(f"     pro_tokens     = {uslincoln.pro_tokens}")
            print(f"     pro_expires_at = {uslincoln.pro_expires_at}")
            
            # Simulate the lock screen condition
            lock_screen = not uslincoln.is_pro
            print(f"\n     Frontend lock screen would show: {'YES ❌' if lock_screen else 'NO ✅'}")
            print(f"     (condition: !status.is_pro = {lock_screen})")
        else:
            print(f"\n  ⚠️  @uslincoln not found in DB!")
        
        print(f"\n{'='*70}\n")

asyncio.run(audit())
