import asyncio
import logging
import os
import sys
from datetime import datetime

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import func, select, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import Partner, Earning, XPTransaction
from app.models.transaction import PartnerTransaction

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reconcile")

SEEDED_PATTERNS = [
    'alex_crypto', 'sarah_web3', 'dmitry_ton', 'elena', 'maxim', 'julia_s', 
    'andrey_eth', 'natasha', 'sergey_pro', 'olga_k', 'ivan_investor', 
    'marina_digital', 'artur_hub', 'svetlana', 'pavel_x', 'cryptowhale', 
    'nikita_dev', 'anna_slovo', 'vitaliy', 'katerina_m', 'den_rich', 
    'alena_marketing', 'oleg_strategy', 'viktoria', 'stas_zero'
]

async def reconcile(dry_run=True):
    # Ensure we use the correct async driver
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    engine = create_async_engine(db_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 1. Reconcile Referral Counts
        logger.info(f"--- Reconciling Referral Counts (Dry Run: {dry_run}) ---")
        
        # Get all partners
        partners_stmt = select(Partner)
        result = await session.exec(partners_stmt)
        all_partners = result.all()
        
        reconciled_count = 0
        for p in all_partners:
            # Count actual children in DB
            actual_count = (await session.exec(text(f"SELECT COUNT(*) FROM partner WHERE referrer_id = {p.id}"))).scalar()
            
            if p.referral_count != actual_count:
                logger.info(f"  - [{p.id}] @{p.username}: Counter={p.referral_count} -> Actual={actual_count}")
                if not dry_run:
                    p.referral_count = actual_count
                    session.add(p)
                    reconciled_count += 1

        if not dry_run:
            await session.commit()
            logger.info(f"Successfully reconciled {reconciled_count} partner counters.")
        else:
            logger.info("Dry run complete. No changes made.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true", help="Actually execute the changes")
    args = parser.parse_args()
    
    asyncio.run(reconcile(dry_run=not args.execute))
