import logging
import random

from sqlmodel import select

from app.core.broker import broker
from app.models.partner import Earning, Partner, XPTransaction
from app.services.leaderboard_service import leaderboard_service
from app.services.redis_service import redis_service
from app.utils.ranking import get_level

logger = logging.getLogger(__name__)

@broker.task(task_name="simulate_artificial_activity", schedule=[{"cron": "0 */3 * * *"}]) # Every 3 hours
async def simulate_artificial_activity():
    """
    Injects random XP and USDT into test users every 3 hours to simulate organic activity.
    Specific targets: is_test=True
    Simulation: 20-150 XP, 10-65 USDT
    """
    from sqlalchemy.orm import sessionmaker
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.models.partner import engine
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Fetch all marked test partners
        statement = select(Partner).where(Partner.is_test == True)
        result = await session.exec(statement)
        test_partners = result.all()
        
        if not test_partners:
            logger.info("ℹ️ No test partners found for artificial activity simulation.")
            return

        logger.info(f"🤖 Processing artificial activity for {len(test_partners)} test partners...")
        
        for partner in test_partners:
            # 1. Random XP gain (20 to 150)
            xp_gain = round(random.uniform(20, 150), 1)
            partner.xp += xp_gain
            
            # Auto-calculate and update level
            partner.level = get_level(partner.xp)
            
            # Record XP transaction for history
            xp_tx = XPTransaction(
                partner_id=partner.id,
                amount=xp_gain,
                type="SIMULATED",
                description="Organic Activity Simulation"
            )
            session.add(xp_tx)
            
            # 2. Random USDT gain (10 to 65)
            usdt_gain = round(random.uniform(10, 65), 2)
            partner.balance += usdt_gain
            
            # Record Earning for history
            earning = Earning(
                partner_id=partner.id,
                amount=usdt_gain,
                currency="USDT",
                type="COMMISSION", # Mark as commission to make it look real
                description="Network Activity Reward",
                level=1 # Dummy level for the log
            )
            session.add(earning)
            
            # 3. Synchronize with Leaderboard (Redis)
            await leaderboard_service.increment_score(partner.id, xp_gain, is_test=True)
            
            # 4. Invalidate profile cache
            await redis_service.client.delete(f"partner:profile:{partner.telegram_id}")
            
            session.add(partner)
            
        try:
            await session.commit()
            logger.info(f"✅ Successfully simulated activity for {len(test_partners)} partners.")
        except Exception as e:
            logger.error(f"❌ Artificial activity simulation failed: {e}")
            await session.rollback()
