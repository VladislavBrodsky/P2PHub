import json
import asyncio
import logging
from bot import bot
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

NOTIFICATION_QUEUE_KEY = "queue:notifications"

class NotificationService:
    async def enqueue_notification(self, chat_id: int, text: str, parse_mode: str = "Markdown"):
        """Pushes a notification task to the Redis queue."""
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }
        try:
            await redis_service.lpush(NOTIFICATION_QUEUE_KEY, json.dumps(payload))
        except Exception as e:
            logger.error(f"Failed to enqueue notification for {chat_id}: {e}")
            # Fallback to direct sending if Redis is down (best effort)
            try:
                await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
            except:
                pass

    async def process_notifications_worker(self):
        """Infinite worker loop that processes the notification queue."""
        logger.info("🚀 Notification Worker Started")
        while True:
            try:
                # Blocking pop from the queue
                result = await redis_service.brpop(NOTIFICATION_QUEUE_KEY, timeout=5)
                if not result:
                    continue
                
                # result is (key, value) tuple
                _, payload_json = result
                payload = json.loads(payload_json)
                
                chat_id = payload.get("chat_id")
                text = payload.get("text")
                parse_mode = payload.get("parse_mode", "Markdown")

                if chat_id and text:
                    try:
                        await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
                        # Add bit of sleep to respect rate limits
                        await asyncio.sleep(0.05) 
                    except Exception as send_err:
                        logger.error(f"Failed to send queued notification to {chat_id}: {send_err}")
                        # Could re-queue here with retry logic, but for now we skip to avoid infinite loops
            
            except asyncio.CancelledError:
                logger.info("🛑 Notification Worker Stopping...")
                break
            except Exception as e:
                logger.error(f"Error in Notification Worker loop: {e}")
                await asyncio.sleep(1) # Backoff on error

notification_service = NotificationService()
