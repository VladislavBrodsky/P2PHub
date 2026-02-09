
import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

async def check():
    db_url = os.environ["DATABASE_URL"]
    engine = create_async_engine(db_url, echo=False, future=True)
    
    async with engine.connect() as conn:
        print("🔍 Debugging User 9 Lineage...")
        res = await conn.execute(text("SELECT id, username, path, referrer_id FROM partner WHERE username LIKE 'sim_user_9%' ORDER BY created_at DESC LIMIT 1"))
        user9 = res.first()
        if not user9:
            print("❌ User 9 not found!")
            return
            
        print(f"👉 USER9: ID={user9[0]}, NAME={user9[1]}, PATH='{user9[2]}', REF_ID={user9[3]}")
        
        path_ids = [int(x) for x in user9[2].split('.')] if user9[2] else []
        lineage_ids = (path_ids + [user9[3]])[-9:]
        print(f"👉 LINEAGE IDS (calc): {lineage_ids}")
        
        # Check if ID 1 (@uslincoln) is in there
        if 1 in lineage_ids:
            print("✅ Root ID 1 is in lineage list.")
        else:
            print("❌ Root ID 1 is MISSING from lineage list!")

        # Check ancestors in DB
        res = await conn.execute(text(f"SELECT id, username, referrer_id FROM partner WHERE id IN ({', '.join(map(str, lineage_ids))})"))
        ancestors = {r[0]: (r[1], r[2]) for r in res}
        print(f"👉 Ancestors in DB: {ancestors}")
        
        # Trace the loop logic
        print("\n🔄 Tracing loop logic...")
        curr_ref_id = user9[3]
        for level in range(1, 10):
            if not curr_ref_id:
                print(f"   Level {level}: No more referrers. BREAK.")
                break
                
            ref_info = ancestors.get(curr_ref_id)
            if not ref_info:
                print(f"   Level {level}: Referrer {curr_ref_id} NOT FOUND in ancestor map! BREAK.")
                break
                
            name, next_ref_id = ref_info
            print(f"   Level {level}: Awarded to @{name} (ID {curr_ref_id})")
            curr_ref_id = next_ref_id

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
