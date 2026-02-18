
import asyncio
from sqlmodel import select
from app.models.partner import Partner, engine
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import UTC, datetime

async def migrate_pro_users():
    async with AsyncSession(engine) as session:
        # Standardize all current PRO users as LIFETIME since we are under the 300 limit
        stmt = select(Partner).where(Partner.is_pro == True)
        res = await session.exec(stmt)
        partners = res.all()
        
        print(f"Migrating {len(partners)} PRO partners to Lifetime...")
        for p in partners:
            old_plan = p.subscription_plan
            # If it's a special plan like GIFTED, we might want to keep it or upgrade it.
            # But the user asked for tier logic for PRO purchases. 
            # Everyone who bought is definitely in the first 300.
            if old_plan in [None, "PRO_MONTHLY", "PRO_LIFETIME"]:
                p.subscription_plan = "PRO_LIFETIME"
                p.pro_expires_at = None
                print(f"Partner {p.id}: {old_plan} -> PRO_LIFETIME")
            elif old_plan == "PRO_PLUS_MONTHLY":
                # PRO+ is always lifetime in our current logic
                p.pro_expires_at = None
                print(f"Partner {p.id}: PRO_PLUS_MONTHLY -> PRO_PLUS (LIFETIME)")
            else:
                print(f"Skipping partner {p.id} with special plan: {old_plan}")
            
            session.add(p)
            
        await session.commit()
        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate_pro_users())
