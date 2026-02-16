import logging
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)

from app.models.partner import Earning, Partner, PartnerTask, get_session
from app.models.transaction import PartnerTransaction
from app.services.notification_service import notification_service
from sqlmodel import func, select, text


class AdminService:
    async def broadcast_message(self, text: str, filters: dict | None = None):
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
            for tg_id, _lang in partners:
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

    async def get_dashboard_stats(self, force_refresh: bool = False) -> dict[str, Any]:
        """Calculates KPIs for the admin dashboard with materialization."""

        async for session in get_session():
            if not force_refresh:
                cached = await self._get_cached_stats(session)
                if cached: return cached

            # Heavy Computation Start
            now = datetime.utcnow()
            
            # 1. Growth Stats
            growth = await self._calculate_growth_metrics(session, now)
            
            # 2. General Totals
            totals = await self._calculate_general_totals(session, now)
            
            # 3. Financials
            financials = await self._calculate_financial_metrics(session)
            
            # 4. Daily Performance Charts
            daily_growth, daily_revenue = await self._calculate_daily_performance(session, now)

            # 5. Recent Sales
            recent_sales = await self._calculate_recent_sales(session)

            # 6. Task Breakdown
            task_breakdown = await self._calculate_task_breakdown(session)

            # 7. Final Assembly
            stats = {
                "growth": growth,
                "daily_growth": daily_growth,
                "daily_revenue": daily_revenue,
                "recent_sales": recent_sales,
                "events": totals,
                "kpis": self._calculate_kpis(totals, financials["total_revenue"]),
                "financials": financials,
                "tasks": task_breakdown,
                "top_partners": await self.get_top_partners(limit=5),
                "server_time": now.isoformat()
            }

            await self._materialize_stats(session, stats)
            return stats

    async def _get_cached_stats(self, session) -> dict | None:
        import json

        from app.models.partner import SystemSetting
        cache_item = (await session.exec(select(SystemSetting).where(SystemSetting.key == "cache:admin_stats"))).first()
        if cache_item:
            try:
                data = json.loads(cache_item.value)
                data["cached_at"] = cache_item.updated_at.isoformat()
                return data
            except Exception:
                pass
        return None

    async def _calculate_growth_metrics(self, session, now: datetime) -> dict:
        periods = {"24h": timedelta(hours=24), "7d": timedelta(days=7), "30d": timedelta(days=30), "90d": timedelta(days=90)}
        growth = {}
        for label, delta in periods.items():
            start, prev_start = now - delta, now - (delta * 2)
            curr = (await session.exec(select(func.count(Partner.id)).where(Partner.created_at >= start))).one()
            prev = (await session.exec(select(func.count(Partner.id)).where(Partner.created_at >= prev_start, Partner.created_at < start))).one()
            pct = ((curr - prev) / prev * 100) if prev > 0 else 0
            growth[label] = {"count": curr, "previous": prev, "percent_change": round(pct, 1)}
        return growth

    async def _calculate_general_totals(self, session, now: datetime) -> dict:
        total_partners = (await session.exec(select(func.count(Partner.id)))).one()
        total_pro = (await session.exec(select(func.count(Partner.id)).where(Partner.is_pro))).one()
        total_tasks = (await session.exec(select(func.count(PartnerTask.id)))).one()
        active_24h = (await session.exec(select(func.count(Partner.id)).where(
            (Partner.last_checkin_at >= now - timedelta(hours=24)) | (Partner.created_at >= now - timedelta(hours=24))
        ))).one()
        return {"total_partners": total_partners, "total_pro": total_pro, "total_tasks": total_tasks, "active_24h": active_24h}

    async def _calculate_financial_metrics(self, session) -> dict:
        rev_ton = (await session.exec(select(func.sum(PartnerTransaction.amount)).where(PartnerTransaction.status == "completed", PartnerTransaction.currency == "TON"))).one() or 0.0
        rev_usdt = (await session.exec(select(func.sum(PartnerTransaction.amount)).where(PartnerTransaction.status == "completed", PartnerTransaction.currency == "USDT"))).one() or 0.0
        total_revenue = rev_usdt + (rev_ton * 5.0)
        
        comm_res = await session.exec(select(Earning.level, func.sum(Earning.amount)).where(Earning.type == "COMMISSION", Earning.level.between(1, 9)).group_by(Earning.level))
        comm_map = {lvl: amt for lvl, amt in comm_res.all()}
        
        breakdown, total_comm = [], 0.0
        for lvl in range(1, 10):
            amt = comm_map.get(lvl, 0.0)
            breakdown.append({"level": lvl, "amount": round(amt, 2)})
            total_comm += amt

        return {
            "total_revenue": round(total_revenue, 2), "total_revenue_ton": round(rev_ton, 2),
            "total_revenue_usdt": round(rev_usdt, 2), "total_commissions": round(total_comm, 2),
            "net_profit": round(total_revenue - total_comm, 2), "commissions_breakdown": breakdown
        }

    async def _calculate_daily_performance(self, session, now: datetime) -> tuple[list, list]:
        from sqlalchemy import Date, cast
        cutoff = now - timedelta(days=14)
        
        growth_res = await session.exec(select(cast(Partner.created_at, Date).label("day"), func.count(Partner.id)).where(Partner.created_at >= cutoff).group_by("day"))
        growth_map = {row[0]: row[1] for row in growth_res.all() if row[0]}
        
        rev_res = await session.exec(select(cast(PartnerTransaction.created_at, Date).label("day"), func.sum(PartnerTransaction.amount)).where(PartnerTransaction.status == "completed", PartnerTransaction.created_at >= cutoff).group_by("day"))
        rev_map = {row[0]: row[1] for row in rev_res.all() if row[0]}
        
        daily_g, daily_r = [], []
        for i in range(13, -1, -1):
            day = (now - timedelta(days=i)).date()
            d_str = day.strftime("%m-%d")
            daily_g.append({"date": d_str, "count": growth_map.get(day, 0)})
            daily_r.append({"date": d_str, "amount": round(rev_map.get(day, 0.0), 2)})
        return daily_g, daily_r

    async def _calculate_recent_sales(self, session) -> list:
        txs = (await session.exec(select(PartnerTransaction).where(PartnerTransaction.status == "completed").order_by(PartnerTransaction.created_at.desc()).limit(15))).all()
        recent = []
        for tx in txs:
            p_info = (await session.exec(select(Partner.username, Partner.telegram_id).where(Partner.id == tx.partner_id))).first()
            recent.append({
                "id": tx.id, "amount": tx.amount, "currency": tx.currency, "tx_hash": tx.tx_hash,
                "created_at": tx.created_at.isoformat(), "username": p_info[0] if p_info else None,
                "telegram_id": p_info[1] if p_info else "Unknown"
            })
        return recent

    async def _calculate_task_breakdown(self, session) -> dict:
        res = await session.exec(select(PartnerTask.task_id, func.count(PartnerTask.id)).group_by(PartnerTask.task_id))
        return {tid: count for tid, count in res.all()}

    def _calculate_kpis(self, totals: dict, total_revenue: float) -> dict:
        tp, tpro = totals["total_partners"], totals["total_pro"]
        return {
            "conversion_rate": round((tpro / tp * 100) if tp > 0 else 0, 2),
            "arpu": round((total_revenue / tp) if tp > 0 else 0, 2),
            "retention_estimate": 85.5
        }

    async def _materialize_stats(self, session, stats: dict):
        import json

        from app.models.partner import SystemSetting
        try:
            val = json.dumps(stats)
            item = (await session.exec(select(SystemSetting).where(SystemSetting.key == "cache:admin_stats"))).first()
            if item: item.value = val
            else: session.add(SystemSetting(key="cache:admin_stats", value=val))
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to materialize: {e}")

    async def get_top_partners(self, limit: int = 10) -> list[dict[str, Any]]:
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
             .where(Earning.currency != "XP") \
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

    async def search_partners(self, query: str) -> list[dict[str, Any]]:
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

    async def get_global_network_stats(self) -> dict[str, int]:
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

    async def get_global_network_members(self, level: int) -> list[dict[str, Any]]:
        """
        Returns top 100 partners for a specific level globally.
        """
        async for session in get_session():
            stmt = select(Partner).where(Partner.level == level).order_by(Partner.xp.desc()).limit(100)
            result = await session.exec(stmt)
            partners = result.all()
            
            return [
                {
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
                } for p in partners
            ]

    async def recalculate_all_referral_counts(self) -> dict[str, Any]:
        """
        Force recalculates structural fields (path, depth, referral_count) for all partners.
        Uses the high-performance unified maintenance service.
        """
        from app.services.maintenance_service import reconcile_network_stats
        return await reconcile_network_stats()

admin_service = AdminService()
