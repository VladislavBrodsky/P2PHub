import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

async def main():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://")
        
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find a partner that HAS referrals
        res = await session.execute(text("SELECT id, telegram_id, path, depth, referral_count FROM partner WHERE referrer_id IS NOT NULL LIMIT 5"))
        some_children = res.fetchall()
        
        print("====== RAW CHILDREN IN DB ======")
        for child in some_children:
            print(f"Child ID: {child.id}, Telegram: {child.telegram_id}, Path: {child.path}, Depth: {child.depth}, RefCount: {child.referral_count}")
            
        print("\n====== TESTING QUERY LOGIC ======")
        # Get a parent
        res2 = await session.execute(text("SELECT id FROM partner WHERE id IN (SELECT referrer_id FROM partner LIMIT 10) LIMIT 1"))
        parent_row = res2.fetchone()
        
        if not parent_row:
            print("Could not find any referrer!")
            return
            
        partner_id = parent_row.id
        
        p_res = await session.execute(text("SELECT id, telegram_id, path, depth, referral_count FROM partner WHERE id = :id"), {"id": partner_id})
        partner = p_res.fetchone()
        print(f"Testing Parent ID {partner_id}: path='{partner.path}', depth={partner.depth}, ref_count={partner.referral_count}")
        
        search_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
        base_depth = len(search_path.split('.'))
        print(f"Logic Vars -> search_path: '{search_path}', base_depth: {base_depth}")
        
        query = text("""
            SELECT depth - :base_depth + 1 as level, COUNT(*) as count
            FROM partner
            WHERE (path = :search_path OR path LIKE :search_wildcard)
            AND depth BETWEEN :base_depth AND :base_depth + 19
            GROUP BY 1
            ORDER BY level;
        """)
        
        result = await session.execute(query, {
            "search_path": search_path,
            "search_wildcard": f"{search_path}.%",
            "base_depth": base_depth
        })
        
        rows = result.fetchall()
        print(f"SQL Rows Returned: {rows}")
        
        # Now let's try a simple raw check to see if those paths exist
        raw_check = await session.execute(text("SELECT id, path, depth FROM partner WHERE path LIKE :like OR path = :exact LIMIT 5"), {"like": f"{search_path}.%", "exact": search_path})
        print(f"\nRaw path match (LIKE '{search_path}.%' OR = '{search_path}'):")
        for r in raw_check.fetchall():
            print(f" - Found ID: {r.id}, path: {r.path}, depth: {r.depth}")

if __name__ == "__main__":
    asyncio.run(main())
