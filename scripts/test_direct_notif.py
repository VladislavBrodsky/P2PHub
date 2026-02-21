
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.notification_service import notification_service

async def test_notif(chat_id):
    msg = "🧪 *Bypassing Worker Matrix* 🧪\n\nThis is a direct-send diagnostic message. If you receive this, the bot communication and escape logic are functional. We are investigating why the background worker has been silent since Feb 16th. 🚀"
    # We use _fallback_send to bypass the (possibly broken) broker
    await notification_service._fallback_send(chat_id, msg, parse_mode="Markdown", buttons=None)
    
    # Wait for background tasks to finish
    await asyncio.sleep(2)
    print(f"✅ Sent direct test to {chat_id}")

if __name__ == "__main__":
    cid = sys.argv[1] if len(sys.argv) > 1 else "716720099"
    asyncio.run(test_notif(int(cid)))
