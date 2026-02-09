
import asyncio
import os
import secrets
import sys
import argparse
from typing import List

# Set PYTHONPATH to include backend
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Hardcode/Load environment variables BEFORE importing app modules
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

from sqlmodel import select
from app.models.partner import Partner, PartnerTask, XPTransaction
from app.models.transaction import PartnerTransaction
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession
from app.services.redis_service import redis_service

async def migrate(dry_run: bool = True):
    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=False, future=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    print(f"🚀 Starting Migration {'(DRY RUN)' if dry_run else ''}...")
    
    async with async_session() as session:
        # Fetch all partners
        statement = select(Partner)
        result = await session.exec(statement)
        partners = result.all()
        
        updated_count = 0
        skipped_count = 0
        
        for p in partners:
            # Detection logic:
            # 1. Code is None
            # 2. Code is numeric (likely TG ID)
            # 3. Code does not start with P2P-
            
            is_legacy = False
            reason = ""
            
            if p.referral_code is None:
                is_legacy = True
                reason = "None"
            elif p.referral_code.isdigit():
                is_legacy = True
                reason = "Numeric (TG ID)"
            elif not p.referral_code.startswith("P2P-"):
                is_legacy = True
                reason = "No P2P prefix"
            
            if is_legacy:
                old_code = p.referral_code
                new_code = f"P2P-{secrets.token_hex(4).upper()}"
                
                print(f"[{'PLAN' if dry_run else 'UPDATE'}] Partner {p.id} (@{p.username}): {old_code} -> {new_code} (Reason: {reason})")
                
                if not dry_run:
                    p.referral_code = new_code
                    session.add(p)
                    
                    # Invalidate Cache
                    cache_key = f"partner:profile:{p.telegram_id}"
                    try:
                        await redis_service.client.delete(cache_key)
                    except Exception as e:
                        print(f"   ⚠️ Cache invalidation failed for {p.telegram_id}: {e}")
                
                updated_count += 1
            else:
                skipped_count += 1
        
        if not dry_run and updated_count > 0:
            await session.commit()
            print(f"\n✅ Successfully committed {updated_count} updates.")
        elif dry_run:
            print(f"\nℹ️ Dry run completed. {updated_count} users would be updated, {skipped_count} users already up-to-date.")
        else:
            print(f"\nℹ️ No updates needed. {skipped_count} users already up-to-date.")

    await engine.dispose()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate legacy referral codes to P2P-XXXX format.")
    parser.add_argument("--apply", action="store_true", help="Apply the changes to the database.")
    args = parser.parse_args()
    
    asyncio.run(migrate(dry_run=not args.apply))
