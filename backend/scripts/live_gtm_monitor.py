import asyncio
import os
import sys
from datetime import datetime, timedelta
from typing import List

# Add parent directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import select, func
from app.models.partner import Partner, Earning, XPTransaction
from app.models.transaction import PartnerTransaction
from app.models.partner import get_session

async def monitor_gtm():
    """
    Live GTM Monitoring Script for P2PHub v1.0
    Summarizes network growth, XP distribution, and PRO conversions.
    """
    print("🚀 P2PHub v1.0 - Live GTM Monitor Starting...")
    print("-" * 50)
    
    async for session in get_session():
        # 1. Total Partners
        total_partners = await session.execute(select(func.count(Partner.id)))
        count = total_partners.scalar()
        
        # 2. Recent Growth (Last 1 hour)
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_partners = await session.execute(
            select(func.count(Partner.id)).where(Partner.created_at >= one_hour_ago)
        )
        recent_count = recent_partners.scalar()
        
        # 3. PRO Conversions
        pro_partners = await session.execute(
            select(func.count(Partner.id)).where(Partner.is_pro == True)
        )
        pro_count = pro_partners.scalar()
        
        # 4. Total XP Distributed
        total_xp = await session.execute(select(func.sum(Partner.xp)))
        xp_sum = total_xp.scalar() or 0
        
        # 5. Total Commissions (USDT)
        total_commissions = await session.execute(
            select(func.sum(Earning.amount)).where(Earning.currency == "USDT")
        )
        commissions_sum = total_commissions.scalar() or 0
        
        # 6. Latest 5 Signups
        latest_partners = await session.execute(
            select(Partner).order_by(Partner.created_at.desc()).limit(5)
        )
        latest = latest_partners.scalars().all()
        
        print(f"📊 SYSTEM SNAPSHOT [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
        print(f"👥 Total Partners: {count} ({recent_count} in last hour)")
        print(f"👑 PRO Members:   {pro_count} (Conversion: {(pro_count/count*100) if count > 0 else 0:.1f}%)")
        print(f"⚡ Total XP:      {xp_sum:,.0f} XP")
        print(f"💰 Commissions:   ${commissions_sum:,.2f} USDT")
        print("-" * 50)
        
        if latest:
            print("🆕 LATEST SIGNUPS:")
            for p in latest:
                time_str = p.created_at.strftime('%H:%M:%S')
                print(f"   [{time_str}] TG:{p.telegram_id} | Lvl:{p.level} | Ref:{p.referral_count}")
        else:
            print("🆕 LATEST SIGNUPS: None yet.")
            
        print("-" * 50)
        print("💡 Recommendation: Watch for 'Level Up' and 'Commission' alerts in logs.")
        break

if __name__ == "__main__":
    asyncio.run(monitor_gtm())
