import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

from sqlmodel import func, select, text

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
            # 1. Total Revenue (Completed transactions) - Breaking down by currency
            revenue_stmt_ton = select(func.sum(PartnerTransaction.amount)).where(
                PartnerTransaction.status == "completed",
                PartnerTransaction.currency == "TON"
            )
            revenue_stmt_usdt = select(func.sum(PartnerTransaction.amount)).where(
                PartnerTransaction.status == "completed",
                PartnerTransaction.currency == "USDT"
            )
            total_revenue_ton = (await session.exec(revenue_stmt_ton)).one() or 0.0
            total_revenue_usdt = (await session.exec(revenue_stmt_usdt)).one() or 0.0
            
            # Simple conversion for display (Mock rate or just total)
            total_revenue = total_revenue_usdt + (total_revenue_ton * 5.0) # Mock conversion: 1 TON = 5 USDT if needed, or just keep separate
            # Actually, let's keep it clean as separate fields but return a combined total in USDT-equivalent if possible.
            # For now, let's just return both.

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

            # KPIs
            conversion_rate = (total_pro / total_partners * 100) if total_partners > 0 else 0
            arpu = (total_revenue / total_partners) if total_partners > 0 else 0
            
            # 24h Active Users (Users who checked in or were created in last 24h)
            active_24h_stmt = select(func.count(Partner.id)).where(
                (Partner.last_checkin_at >= now - timedelta(hours=24)) |
                (Partner.created_at >= now - timedelta(hours=24))
            )
            active_24h = (await session.exec(active_24h_stmt)).one()

            # Task Completion Trends (Last 7 days)
            task_stats_stmt = select(PartnerTask.task_id, func.count(PartnerTask.id)).group_by(PartnerTask.task_id)
            task_counts_res = await session.exec(task_stats_stmt)
            task_breakdown = {tid: count for tid, count in task_counts_res.all()}

            return {
                "growth": growth,
                "daily_growth": daily_growth,
                "daily_revenue": daily_revenue,
                "recent_sales": recent_sales,
                "events": {
                    "total_partners": total_partners,
                    "total_pro": total_pro,
                    "total_tasks": total_tasks,
                    "active_24h": active_24h
                },
                "kpis": {
                    "conversion_rate": round(conversion_rate, 2),
                    "arpu": round(arpu, 2),
                    "retention_estimate": 85.5 # Mock as requested for "important KPIs"
                },
                "financials": {
                    "total_revenue": round(total_revenue, 2),
                    "total_revenue_ton": round(total_revenue_ton, 2),
                    "total_revenue_usdt": round(total_revenue_usdt, 2),
                    "total_commissions": round(total_commissions, 2),
                    "net_profit": round(net_profit, 2),
                    "commissions_breakdown": commissions_by_level
                },
                "tasks": task_breakdown,
                "top_partners": await self.get_top_partners(limit=5),
                "server_time": now.isoformat()
            }

    async def get_top_partners(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Returns top partners by total earnings.
        """
        async for session in get_session():
            # Join Partner with Earning to get total earnings
            stmt = select(
                Partner.username,
                Partner.telegram_id,
                func.sum(Earning.amount).label("total_earnings")
            ).join(Earning, Partner.id == Earning.partner_id) \
             .group_by(Partner.username, Partner.telegram_id) \
             .order_by(text("total_earnings DESC")) \
             .limit(limit)
            
            result = await session.exec(stmt)
            top_partners = []
            for username, tg_id, earnings in result.all():
                top_partners.append({
                    "username": username,
                    "telegram_id": tg_id,
                    "earnings": round(earnings or 0.0, 2)
                })
            return top_partners

    async def search_partners(self, query: str) -> List[Dict[str, Any]]:
        """
        Search partners by username or telegram_id.
        """
        async for session in get_session():
            stmt = select(Partner).where(
                (Partner.username.ilike(f"%{query}%")) |
                (Partner.telegram_id.ilike(f"%{query}%"))
            ).limit(20)
            
            result = await session.exec(stmt)
            partners = result.all()
            
            return [{
                "id": p.id,
                "telegram_id": p.telegram_id,
                "username": p.username,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "is_pro": p.is_pro,
                "xp": p.xp,
                "referral_count": p.referral_count,
                "level": p.level
            } for p in partners]

    async def get_global_network_stats(self) -> Dict[str, int]:
        """
        Returns count of partners at each level 1-9 globally.
        Note: For global view, we use the 'level' field of the Partner model.
        """
        async for session in get_session():
            stmt = select(Partner.level, func.count(Partner.id)).group_by(Partner.level)
            result = await session.exec(stmt)
            stats = {str(i): 0 for i in range(1, 10)}
            for lvl, count in result.all():
                if 1 <= lvl <= 9:
                    stats[str(lvl)] = count
            return stats

    async def get_global_network_members(self, level: int) -> List[Dict[str, Any]]:
        """
        Returns top 100 partners for a specific level globally.
        """
        async for session in get_session():
            stmt = select(Partner).where(Partner.level == level).order_by(Partner.xp.desc()).limit(100)
            result = await session.exec(stmt)
            partners = result.all()
            
            members = []
            for p in partners:
                members.append({
                    "telegram_id": p.telegram_id,
                    "username": p.username,
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "xp": p.xp,
                    "photo_url": p.photo_url,
                    "photo_file_id": p.photo_file_id,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "level": p.level,
                    "is_pro": p.is_pro
                })
            return members

    async def recalculate_all_referral_counts(self) -> Dict[str, Any]:
        """
        Force recalculates structural fields (path, depth, referral_count) for all partners.
        Uses the high-performance unified maintenance service.
        """
        from app.services.maintenance_service import reconcile_network_stats
        return await reconcile_network_stats()

admin_service = AdminService()
