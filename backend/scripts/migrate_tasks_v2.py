import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import json
import logging

from sqlmodel import select

from app.models.partner import Partner, PartnerTask, async_session_maker, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def migrate_tasks():
    logger.info("🚀 Starting task migration from Partner.completed_tasks to PartnerTask table...")
    
    async with async_session_maker() as session:
        # Fetch all partners who have something in completed_tasks or completed_stages
        statement = select(Partner)
        result = await session.exec(statement)
        partners = result.all()
        
        migrated_count = 0
        skipped_count = 0
        
        for partner in partners:
            # 1. Handle completed_tasks
            try:
                task_ids = json.loads(partner.completed_tasks or "[]")
            except Exception as e:
                logger.warning(f"⚠️ Failed to parse completed_tasks for partner {partner.id}: {e}")
                task_ids = []
                
            if task_ids:
                # Get existing task records to avoid duplicates
                stmt = select(PartnerTask.task_id).where(PartnerTask.partner_id == partner.id)
                existing_res = await session.exec(stmt)
                existing_ids = set(existing_res.all())
                
                for tid in task_ids:
                    if tid not in existing_ids:
                        new_task = PartnerTask(
                            partner_id=partner.id,
                            task_id=tid,
                            status="COMPLETED",
                            # We don't have the original timestamps, so use partner.updated_at or now
                            completed_at=partner.updated_at
                        )
                        session.add(new_task)
                        migrated_count += 1
                        existing_ids.add(tid)
                    else:
                        skipped_count += 1
            
            # Periodically commit
            if migrated_count % 100 == 0 and migrated_count > 0:
                await session.commit()
                logger.info(f"⏳ Progress: {migrated_count} tasks migrated...")

        await session.commit()
        logger.info("✅ Migration complete!")
        logger.info(f"📊 Summary: {migrated_count} tasks created, {skipped_count} already existed.")

if __name__ == "__main__":
    asyncio.run(migrate_tasks())
