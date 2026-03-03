
import asyncio
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
import json
import sys

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"
sys.path.append("/Users/grandmaestro/Developer/P2PHub/backend")

async def analyze_transactions():
    from app.models.partner import Partner, XPTransaction
    engine = create_async_engine(DATABASE_URL)
    async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username == "lownocoder_TMR")
        result = await session.exec(stmt)
        partner = result.first()
        
        if not partner:
            print("User @lownocoder_TMR not found.")
            return

        print(f"Analyzing {partner.username} (ID: {partner.id})...")
        print(f"Current XP: {partner.xp}")
        
        # Get all XP_AWARD transactions (Academy completions)
        stmt_tx = select(XPTransaction).where(
            XPTransaction.partner_id == partner.id, 
            XPTransaction.type == "XP_AWARD"
        )
        result_tx = await session.exec(stmt_tx)
        transactions = result_tx.all()
        
        print(f"Total XP_AWARD transactions: {len(transactions)}")
        
        # Count by stage_id (reference_id)
        stage_counts = {}
        stage_xp = {}
        for tx in transactions:
            sid = tx.reference_id
            stage_counts[sid] = stage_counts.get(sid, 0) + 1
            stage_xp[sid] = stage_xp.get(sid, 0) + tx.amount

        duplicates = {sid: count for sid, count in stage_counts.items() if count > 1}
        print(f"Stages with duplicate completions: {len(duplicates)}")
        
        total_excess = 0
        for sid, count in duplicates.items():
            # The first completion is valid, the rest are excess
            # We can calculate excess by (total_xp_for_this_sid) - (first_tx_amount)
            # Or just (count - 1) * (standard_reward)
            # Let's find the first transaction amount
            first_amount = 0
            for tx in transactions:
                if tx.reference_id == sid:
                    first_amount = tx.amount
                    break
            
            excess = stage_xp[sid] - first_amount
            total_excess += excess
            if count > 2 or excess > 1000:
                print(f"  Stage {sid}: {count} completions, Total XP: {stage_xp[sid]}, Excess: {excess}")

        print(f"\nCalculated Total Excess XP from Academy: {total_excess}")
        
        # Let's check other XP types
        stmt_other = select(XPTransaction.type, func.sum(XPTransaction.amount)).where(
            XPTransaction.partner_id == partner.id
        ).group_by(XPTransaction.type)
        result_other = await session.exec(stmt_other)
        other_sums = result_other.all()
        
        print("\nXP Breakdown by Type:")
        for tx_type, total in other_sums:
            print(f"  {tx_type}: {total}")
            
        print(f"\nCorrection Suggestion: {partner.xp - total_excess}")

if __name__ == "__main__":
    asyncio.run(analyze_transactions())
