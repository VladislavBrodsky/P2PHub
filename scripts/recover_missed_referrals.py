
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, Earning, async_session_maker
from datetime import datetime, UTC, timedelta
from app.services.notification_service import notification_service
from app.core.config import settings

async def recover_referral_notifs():
    async with async_session_maker() as session:
        # Check the last 1 day (since the incident)
        since = datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=14)
        
        # 1. Find all successful referral xp earns
        stmt = select(Earning).where(
            Earning.type == "REFERRAL_XP",
            Earning.created_at >= since
        )
        txs = (await session.exec(stmt)).all()
        
        print(f"🔍 Found {len(txs)} referral XP since {since}")
        
        for tx in txs:
            recipient = await session.get(Partner, tx.partner_id)
            if not recipient: continue
            
            amount = tx.amount
            desc = tx.description
            
            msg = f"⚡ *RECOVERY NOTIFICATION* ⚡\n\n🎉 *Pending Referral Update*\n\nYou earned *{amount} XP* from your network expansion today: `{desc}`.\n\nDue to the server system update, this message alert was delayed. Your balance & XP were already updated.\n\nKeep building your network! 🚀"
            
            # Send (Direct bypass to ensure delivery)
            buttons = [[
                {"text": "📊 View Network", "web_app": {"url": f"{settings.FRONTEND_URL}?start_param=network"}}
            ]]
            await notification_service._fallback_send(int(recipient.telegram_id), msg, parse_mode="Markdown", buttons=buttons)
            await asyncio.sleep(0.5)

        print(f"🏁 Finished! Recouped {len(txs)} referral notifications.")

if __name__ == "__main__":
    asyncio.run(recover_referral_notifs())
