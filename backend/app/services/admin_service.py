from datetime import datetime, timedelta
from typing import Any, Dict

from sqlmodel import func, select

from app.models.partner import Earning, Partner, PartnerTask, get_session
from app.models.transaction import PartnerTransaction
from app.services.notification_service import notification_service


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
            total_pro = (await session.exec(select(func.count(Partner.id)).where(Partner.is_pro))).one()

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

            # 4. Daily Performance Charts (Last 14 days)
            daily_growth = []
            daily_revenue = []
            for i in range(13, -1, -1):
                day = now - timedelta(days=i)
                day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)

                # Daily Growth
                stmt_growth = select(func.count(Partner.id)).where(
                    Partner.created_at >= day_start,
                    Partner.created_at < day_end
                )
                day_count = (await session.exec(stmt_growth)).one()
                daily_growth.append({
                    "date": day_start.strftime("%m-%d"),
                    "count": day_count
                })

                # Daily Revenue
                stmt_rev = select(func.sum(PartnerTransaction.amount)).where(
                    PartnerTransaction.status == "completed",
                    PartnerTransaction.created_at >= day_start,
                    PartnerTransaction.created_at < day_end
                )
                day_rev = (await session.exec(stmt_rev)).one() or 0.0
                daily_revenue.append({
                    "date": day_start.strftime("%m-%d"),
                    "amount": round(day_rev, 2)
                })

            # 5. Recent Successful Transactions
            stmt_recent = select(PartnerTransaction).where(
                PartnerTransaction.status == "completed"
            ).order_by(PartnerTransaction.created_at.desc()).limit(15)
            recent_res = await session.exec(stmt_recent)
            recent_txs = recent_res.all()

            recent_sales = []
            for tx in recent_txs:
                # Get partner username for display
                p_stmt = select(Partner.username, Partner.telegram_id).where(Partner.id == tx.partner_id)
                p_info = (await session.exec(p_stmt)).first()
                recent_sales.append({
                    "id": tx.id,
                    "amount": tx.amount,
                    "currency": tx.currency,
                    "tx_hash": tx.tx_hash,
                    "created_at": tx.created_at.isoformat(),
                    "username": p_info[0] if p_info else None,
                    "telegram_id": p_info[1] if p_info else "Unknown"
                })

            return {
                "growth": growth,
                "daily_growth": daily_growth,
                "daily_revenue": daily_revenue,
                "recent_sales": recent_sales,
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
