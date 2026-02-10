from sqlmodel import select
from app.models.partner import Partner, get_session
from app.services.notification_service import notification_service
from typing import List

class AdminService:
    async def broadcast_message(self, text: str, filters: dict = None):
        """
        Broadcasting a message to all or filtered partners.
        Uses the notification_service for asynchronous delivery.
        """
        async for session in get_session():
            statement = select(Partner.telegram_id, Partner.language_code)
            
            if filters:
                if "is_pro" in filters:
                    statement = statement.where(Partner.is_pro == filters["is_pro"])
                if "min_level" in filters:
                    statement = statement.where(Partner.level >= filters["min_level"])
            
            result = await session.exec(statement)
            partners = await result.all()
            
            broadcast_count = 0
            for tg_id, lang in partners:
                if tg_id:
                    # Enqueue for each user
                    await notification_service.enqueue_notification(
                        chat_id=int(tg_id),
                        text=text
                    )
                    broadcast_count += 1
            
            return {
                "status": "enqueued",
                "count": broadcast_count
            }

admin_service = AdminService()
