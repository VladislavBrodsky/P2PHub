import json
import asyncio
import logging
from bot import bot
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

NOTIFICATION_QUEUE_KEY = "queue:notifications"

class NotificationService:
    async def enqueue_notification(self, chat_id: int, text: str, parse_mode: str = "Markdown", retry_count: int = 0):
        """Pushes a notification task to the Redis queue."""
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "retry_count": retry_count
        }
        try:
            await redis_service.lpush(NOTIFICATION_QUEUE_KEY, json.dumps(payload))
        except Exception as e:
            logger.error(f"Failed to enqueue notification for {chat_id}: {e}")
            if retry_count == 0: # Only fallback once
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
                
                _, payload_json = result
                payload = json.loads(payload_json)
                
                chat_id = payload.get("chat_id")
                text = payload.get("text")
                parse_mode = payload.get("parse_mode", "Markdown")
                retry_count = payload.get("retry_count", 0)

                if chat_id and text:
                    try:
                        await bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
                        await asyncio.sleep(0.05) # Tiny backoff
                    except Exception as send_err:
                        logger.error(f"Failed to send notification to {chat_id} (Attempt {retry_count + 1}): {send_err}")
                        
                        if retry_count < 3: # Max 3 retries
                            logger.info(f"Re-enqueuing notification for {chat_id}...")
                            await asyncio.sleep(retry_count * 2 + 1) # Exponential-ish backoff
                            await self.enqueue_notification(chat_id, text, parse_mode, retry_count + 1)
                        else:
                            logger.error(f"Max retries reached for {chat_id}. Dropping message.")
            
            except asyncio.CancelledError:
                logger.info("🛑 Notification Worker Stopping...")
                break
            except Exception as e:
                logger.error(f"Error in Notification Worker loop: {e}")
                await asyncio.sleep(1)

notification_service = NotificationService()
