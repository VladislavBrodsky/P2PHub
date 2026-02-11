from datetime import datetime, timedelta
from sqlmodel import select, func, col
from app.models.partner import Partner, Earning, PartnerTask, get_session
from app.models.transaction import PartnerTransaction
from app.services.notification_service import notification_service
from typing import List, Dict, Any

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
            partners = result.all()
            
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

    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """
        Calculates KPIs for the admin dashboard.
        """
        async for session in get_session():
            now = datetime.utcnow()
            
            periods = {
                "24h": timedelta(hours=24),
                "7d": timedelta(days=7),
                "30d": timedelta(days=30),
                "90d": timedelta(days=90)
            }
            
            growth = {}
            for label, delta in periods.items():
                period_start = now - delta
                prev_period_start = now - (delta * 2)
                
                # Current period count
                stmt = select(func.count(Partner.id)).where(Partner.created_at >= period_start)
                current_count = (await session.exec(stmt)).one()
                
                # Previous period count
                stmt_prev = select(func.count(Partner.id)).where(
                    Partner.created_at >= prev_period_start,
                    Partner.created_at < period_start
                )
                prev_count = (await session.exec(stmt_prev)).one()
                
                pct_change = 0
                if prev_count > 0:
                    pct_change = ((current_count - prev_count) / prev_count) * 100
                
                growth[label] = {
                    "count": current_count,
                    "previous": prev_count,
                    "percent_change": round(pct_change, 1)
                }

            # Key Events
            # 1. Total Partners
            total_partners = (await session.exec(select(func.count(Partner.id)))).one()
            
            # 2. PRO Upgrades (Total is_pro=True)
            total_pro = (await session.exec(select(func.count(Partner.id)).where(Partner.is_pro == True))).one()
            
            # 3. Tasks Completed (Total unique tasks)
            total_tasks = (await session.exec(select(func.count(PartnerTask.id)))).one()

            # Financials
            # 1. Total Revenue (Completed transactions)
            revenue_stmt = select(func.sum(PartnerTransaction.amount)).where(PartnerTransaction.status == "completed")
            total_revenue = (await session.exec(revenue_stmt)).one() or 0.0
            
            # 2. Commissions by Level (1-9)
            commissions_by_level = []
            total_commissions = 0.0
            for level in range(1, 10):
                stmt_comm = select(func.sum(Earning.amount)).where(
                    Earning.type == "COMMISSION",
                    Earning.level == level
                )
                level_amount = (await session.exec(stmt_comm)).one() or 0.0
                commissions_by_level.append({
                    "level": level,
                    "amount": round(level_amount, 2)
                })
                total_commissions += level_amount
                
            # 3. Net Profit (Clear Income)
            net_profit = total_revenue - total_commissions
            
            return {
                "growth": growth,
                "events": {
                    "total_partners": total_partners,
                    "total_pro": total_pro,
                    "total_tasks": total_tasks
                },
                "financials": {
                    "total_revenue": round(total_revenue, 2),
                    "total_commissions": round(total_commissions, 2),
                    "net_profit": round(net_profit, 2),
                    "commissions_breakdown": commissions_by_level
                },
                "server_time": now.isoformat()
            }

admin_service = AdminService()
