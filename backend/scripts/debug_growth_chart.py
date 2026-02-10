
import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.models.partner import engine, Partner
from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

async def debug_growth():
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Get partner with most referrals to debug
        stmt = select(Partner).order_by(Partner.referral_count.desc()).limit(1)
        res = await session.exec(stmt)
        partner = res.first()
        
        if not partner:
            print("No partner found in DB")
            return

        print(f"DEBUGGING FOR PARTNER: ID={partner.id}, Path={partner.path}, Referral Count={partner.referral_count}")

        # Replicate service logic
        search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
        base_depth = len(search_path.split('.'))
        
        print(f"Search Path: '{search_path}'")
        print(f"Base Depth: {base_depth}")
        print(f"Search Wildcard: '{search_path}.%'")

        # Check raw counts with simple query
        count_stmt = text("SELECT count(*) FROM partner WHERE path = :sp OR path LIKE :sw")
        res_count = await session.execute(count_stmt, {"sp": search_path, "sw": f"{search_path}.%"})
        total_found = res_count.scalar()
        print(f"Total Found via Path Query: {total_found}")

        # Check raw data sample
        sample_stmt = text("SELECT id, path, created_at FROM partner WHERE path = :sp LIMIT 5")
        res_sample = await session.execute(sample_stmt, {"sp": search_path})
        print("Sample Children (Direct):")
        for row in res_sample:
            print(f"  ID: {row[0]}, Path: {row[1]}, Created: {row[2]}")

        # Check the Level Logic
        query_levels = text("""
            SELECT 
                (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) - :base_depth + 1 as level,
                COUNT(*) as count
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            GROUP BY level
            ORDER BY level;
        """)
        
        res_levels = await session.execute(query_levels, {
            "search_path": search_path, 
            "search_wildcard": f"{search_path}.%",
            "base_depth": base_depth
        })
        print("\nLevels Breakdown:")
        for row in res_levels:
            print(f"  Level {row[0]}: {row[1]}")

        # Check Time Series Base Query (Previous Count)
        # Using 7D logic
        now = datetime.utcnow()
        start_time = now - timedelta(days=7)
        print(f"\nChecking Base Count (Before {start_time}):")
        
        stmt_base = text("""
            SELECT 
                (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) - :base_depth + 1 as level,
                COUNT(*) 
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            AND created_at < :start
            GROUP BY level
        """)
        
        res_base = await session.execute(stmt_base, {
            "search_path": search_path,
            "search_wildcard": f"{search_path}.%",
            "start": start_time,
            "base_depth": base_depth
        })
        
        for row in res_base:
            print(f"  Base Level {row[0]}: {row[1]}")

if __name__ == "__main__":
    asyncio.run(debug_growth())
