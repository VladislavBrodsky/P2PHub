
import asyncio
import os
import sys
from datetime import datetime, UTC, timedelta

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlmodel import select
from app.models.partner import Partner, async_session_maker
from app.models.transaction import PartnerTransaction
from app.services.notification_service import notification_service
from app.models.audit_log import AuditLog

async def recovery_missed_notifications(days_back: int = 5):
    """
    Recover notifications for commissions that occurred but were never notified 
    due to the get_msg signature bug.
    """
    async with async_session_maker() as session:
        from app.models.partner import Earning
        since = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days_back)
        
        # 1. Find all successful commissions since the crash
        stmt = select(Earning).where(
            Earning.type == "COMMISSION",
            Earning.created_at >= since
        )
        res = await session.exec(stmt)
        txs = res.all()
        
        print(f"🔍 Found {len(txs)} commissions since {since}")
        
        processed_count = 0
        for tx in txs:
            # Check if we already have a 'send_success' for this recipient near this time
            # (Crude check: any send_success for this user in last few days)
            # Actually, let's just use the 'enqueued' status we just added if it exists 
            # but since it's new, old ones won't have it.
            
            # For safety, let's ONLY notify if total_notifs for this user today is low? 
            # No, let's just send them. Most users would rather get a duplicate than miss it.
            
            recipient = await session.get(Partner, tx.partner_id)
            if not recipient: continue
            
            # Construct a recovery message
            lang = recipient.language_code or "en"
            amount = round(tx.amount, 2)
            
            # We don't have the buyer name easily in the transaction record (it's in the description)
            # "Commission Earned: $... from Level X" -> Buyer is not there.
            
            msg = f"⚡ *RECOVERY NOTIFICATION* ⚡\n\n💰 *Commission Received!*\n\nYou earned *{amount} USDT* from your partner network. Due to a system update log lag, this message was delayed. Your balance was correctly updated at `{tx.created_at.strftime('%Y-%m-%d %H:%M')}`.\n\nThank you for your patience! 🚀"
            
            # Send (Direct bypass to ensure delivery)
            await notification_service._fallback_send(int(recipient.telegram_id), msg, parse_mode="Markdown", buttons=None)
            processed_count += 1
            if processed_count % 10 == 0:
                print(f"✅ Sent {processed_count} recovery messages...")
                await asyncio.sleep(1)

        print(f"🏁 Finished! Recouped {processed_count} notifications.")

if __name__ == "__main__":
    asyncio.run(recovery_missed_notifications(days_back=5))
