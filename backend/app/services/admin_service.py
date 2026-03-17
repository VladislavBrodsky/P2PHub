import logging
import time
from datetime import UTC, datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)

import contextlib

from sqlalchemy.orm import selectinload
from sqlmodel import func, select, text

from app.core.config import settings
from app.models.partner import Earning, Partner, PartnerTask, get_session
from app.models.transaction import PartnerTransaction
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.services.payment_service import payment_service
from app.services.redis_service import redis_service


class AdminService:
    async def get_dashboard_stats(self, force_refresh: bool = False) -> dict[str, Any]:
        """Calculates KPIs for the admin dashboard with materialization."""
        from sqlalchemy.exc import DBAPIError

        async for session in get_session():
            if not force_refresh:
                cached = await self._get_cached_stats(session)
                if cached: return cached

            # #comment: Advanced Reliability (Phase 2)
            # Prevent dashboard queries from locking up DB connections.
            # If queries take longer than 5 seconds, throw a timeout error.
            try:
                await session.execute(text("SET statement_timeout = '5s'"))
                
                # Heavy Computation Start
                now = datetime.now(UTC).replace(tzinfo=None)
            
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

                # 7. Viral Metrics
                viral_metrics = await self._calculate_viral_metrics(session, totals["total_partners"])

                # 8. System Audit (Lightweight)
                audit_summary = await self._perform_system_audit(session)
                
                # Additional Performance KPI: Avg Manual Approval Time
                # Calculates average minutes from transaction creation to manual approval
                stmt_approval = text(
                    "SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) / 60 "
                    "FROM partnertransaction WHERE status = 'completed' AND tx_hash IS NULL"
                )
                avg_approval_min = (await session.execute(stmt_approval)).scalar() or 0.0
                
                # 9. Sync & Materialize
                # Auto-align the slots_sold counter with reality if it drifts too far
                pro_lifetime_count = (await session.exec(select(func.count(Partner.id)).where(Partner.subscription_plan == "PRO_LIFETIME", Partner.is_test == False))).one() or 0
                
                from app.models.partner import SystemSetting
                setting_sold = (await session.exec(select(SystemSetting).where(SystemSetting.key == "pro_slots_sold"))).first()
                
                # Historical Baseline: We start at 147 as requested by user to show momentum.
                base_slots = 147
                current_effective_sold = base_slots + pro_lifetime_count
                
                if not setting_sold:
                    session.add(SystemSetting(key="pro_slots_sold", value=str(current_effective_sold)))
                    await session.commit()
                elif int(setting_sold.value) < current_effective_sold:
                    setting_sold.value = str(current_effective_sold)
                    session.add(setting_sold)
                    await session.commit()
                
                # Final Assembly
                stats = {
                    "growth": growth,
                    "daily_growth": daily_growth,
                    "daily_revenue": daily_revenue,
                    "recent_sales": recent_sales,
                    "performance": {
                        "avg_manual_approval_min": round(float(avg_approval_min), 1),
                        "pro_slots_actual": pro_lifetime_count,
                        "pro_slots_display": int(setting_sold.value) if setting_sold else current_effective_sold
                    },
                    "events": {**totals, "audit": audit_summary},
                    "kpis": {**self._calculate_kpis(totals, financials["total_revenue"]), **viral_metrics},
                    "financials": financials,
                    "tasks": task_breakdown,
                    "top_partners": await self.get_top_partners(limit=10),
                    "server_time": now.isoformat()
                }

                await self._materialize_stats(session, stats)
                return stats
            except DBAPIError as e:
                # Catch query timeouts (QueryCanceledError) and other DB errors
                logger.error(f"🚨 DB Error during get_dashboard_stats (likely timeout): {e}")
                
                # Try to fall back to the last known good cache, even if force_refresh was requested
                cached_fallback = await self._get_cached_stats(session)
                if cached_fallback:
                    logger.warning("Falling back to cached dashboard stats due to DB timeout.")
                    cached_fallback["_is_fallback"] = True
                    return cached_fallback
                    
                # If no cache exists, raise an HTTP error so the frontend knows to retry later
                from fastapi import HTTPException
                raise HTTPException(status_code=503, detail="Analytics database is currently overloaded. Please try again in a few minutes.")

    async def get_public_kpis(self) -> dict[str, Any]:
        """
        Returns non-sensitive KPIs for the public landing page.
        Optimized with dedicated Redis caching for high availability.
        """
        cache_key = "kpi:public_stats"
        
        # 1. Try dedicated Redis Cache first (Fastest)
        try:
            cached = await redis_service.get_json(cache_key)
            if cached:
                return cached
        except Exception as e:
            logger.warning(f"KPI cache read failed: {e}")

        async for session in get_session():
            # 2. Try Admin Stats Cache as secondary source
            admin_cached = await self._get_cached_stats(session)
            
            total_partners = 0
            total_revenue = 0.0
            
            if admin_cached:
                total_partners = admin_cached["events"]["total_partners"]
                total_revenue = admin_cached["financials"]["total_revenue"]
            else:
                # 3. Last Resort Fallback: Direct Query (Optimized)
                try:
                    total_partners = (await session.exec(select(func.count(Partner.id)).where(Partner.is_test == False))).one() or 0
                    
                    rev_stmt = select(PartnerTransaction.currency, func.sum(PartnerTransaction.amount_crypto if PartnerTransaction.currency == "TON" else PartnerTransaction.amount)) \
                        .join(Partner, Partner.id == PartnerTransaction.partner_id) \
                        .where(
                            PartnerTransaction.status == "completed",
                            Partner.is_test == False,
                            ~PartnerTransaction.network.in_(["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"])
                        ) \
                        .group_by(PartnerTransaction.currency)
                    
                    results = await session.exec(rev_stmt)
                    rows = results.all()
                    
                    ton_price = 5.0
                    with contextlib.suppress(BaseException):
                        ton_price = await payment_service.get_ton_price()
                    
                    for currency, amount in rows:
                        if currency == "TON":
                            total_revenue += (amount or 0.0) * ton_price
                        else:
                            total_revenue += (amount or 0.0)
                except Exception as e:
                    logger.error(f"Failed fallback KPI calc: {e}")

            # Deterministic Countries Logic: Base + growth factor
            # Every 1000 users, we simulate entry into 1 new country if < 195
            base_countries = 142
            dynamic_countries = min(195, base_countries + (total_partners // 1000))

            stats = {
                "total_partners": total_partners,
                "volume_usdt": round(total_revenue, 1),
                "countries": dynamic_countries,
                "updated_at": datetime.now(UTC).isoformat()
            }

            # Cache for 2 minutes - enough to feel live, long enough to protect DB
            try:
                await redis_service.set_json(cache_key, stats, expire=120)
            except Exception as e:
                logger.warning(f"KPI cache write failed: {e}")

            return stats

    async def _get_cached_stats(self, session) -> dict | None:
        import json

        from app.models.partner import SystemSetting
        cache_item = (await session.exec(select(SystemSetting).where(SystemSetting.key == "cache:admin_stats"))).first()
        if cache_item:
            try:
                now = datetime.now(UTC).replace(tzinfo=None)
                if getattr(cache_item, "updated_at", None) and now - cache_item.updated_at > timedelta(minutes=1):
                    return None
                    
                data = json.loads(cache_item.value)
                data["cached_at"] = cache_item.updated_at.isoformat()
                return data
            except Exception:
                pass
        return None

    async def _calculate_growth_metrics(self, session, now: datetime) -> dict:
        """Single-query optimization for all growth periods."""
        # Find the earliest needed date (90d * 2 = 180d)
        max_delta = timedelta(days=90 * 2)
        _earliest = now - max_delta
        
        # Build one giant query with conditional counts
        # This reduces 8 queries down to 1.
        # We use func.count(text(...)) with select_from(Partner) to ensure table context.
        stmt = select(
            func.count(text("CASE WHEN partner.created_at >= :h24 THEN 1 END")),
            func.count(text("CASE WHEN partner.created_at >= :h48 AND partner.created_at < :h24 THEN 1 END")),
            func.count(text("CASE WHEN partner.created_at >= :d7 THEN 1 END")),
            func.count(text("CASE WHEN partner.created_at >= :d14 AND partner.created_at < :d7 THEN 1 END")),
            func.count(text("CASE WHEN partner.created_at >= :d30 THEN 1 END")),
            func.count(text("CASE WHEN partner.created_at >= :d60 AND partner.created_at < :d30 THEN 1 END")),
            func.count(text("CASE WHEN partner.created_at >= :d90 THEN 1 END")),
            func.count(text("CASE WHEN partner.created_at >= :d180 AND partner.created_at < :d90 THEN 1 END")),
        ).select_from(Partner).where(Partner.is_test == False).params(
            h24=now-timedelta(hours=24),
            h48=now-timedelta(hours=48),
            d7=now-timedelta(days=7),
            d14=now-timedelta(days=14),
            d30=now-timedelta(days=30),
            d60=now-timedelta(days=60),
            d90=now-timedelta(days=90),
            d180=now-timedelta(days=180)
        )
        
        counts = (await session.exec(stmt)).first()
        if not counts: return {}

        c24, p24, c7, p7, c30, p30, c90, p90 = counts
        
        def calc_pct(c, p):
            return round(((c - p) / p * 100), 1) if p > 0 else 0.0

        return {
            "24h": {"count": c24, "previous": p24, "percent_change": calc_pct(c24, p24)},
            "7d": {"count": c7, "previous": p7, "percent_change": calc_pct(c7, p7)},
            "30d": {"count": c30, "previous": p30, "percent_change": calc_pct(c30, p30)},
            "90d": {"count": c90, "previous": p90, "percent_change": calc_pct(c90, p90)}
        }

    async def _calculate_general_totals(self, session, now: datetime) -> dict:
        total_partners = (await session.exec(select(func.count(Partner.id)).where(Partner.is_test == False))).one() or 0
        total_pro = (await session.exec(select(func.count(Partner.id)).where(Partner.is_pro, Partner.is_test == False))).one() or 0
        total_tasks = (await session.exec(select(func.count(PartnerTask.id)).join(Partner).where(Partner.is_test == False))).one() or 0
        
        active_24h = (await session.exec(select(func.count(Partner.id)).where(
            Partner.is_test == False,
            (Partner.last_checkin_at >= now - timedelta(hours=24)) | (Partner.created_at >= now - timedelta(hours=24))
        ))).one() or 0

        active_7d = (await session.exec(select(func.count(Partner.id)).where(
            Partner.is_test == False,
            (Partner.last_checkin_at >= now - timedelta(days=7)) | (Partner.created_at >= now - timedelta(days=7))
        ))).one() or 0

        active_30d = (await session.exec(select(func.count(Partner.id)).where(
            Partner.is_test == False,
            (Partner.last_checkin_at >= now - timedelta(days=30)) | (Partner.created_at >= now - timedelta(days=30))
        ))).one() or 0

        active_90d = (await session.exec(select(func.count(Partner.id)).where(
            Partner.is_test == False,
            (Partner.last_checkin_at >= now - timedelta(days=90)) | (Partner.created_at >= now - timedelta(days=90))
        ))).one() or 0

        active_180d = (await session.exec(select(func.count(Partner.id)).where(
            Partner.is_test == False,
            (Partner.last_checkin_at >= now - timedelta(days=180)) | (Partner.created_at >= now - timedelta(days=180))
        ))).one() or 0

        # #comment: Count active payment sessions (pending in last 24h)
        # This helps admins see user interest even if no manual submissions exist.
        pending_payments = (await session.exec(select(func.count(PartnerTransaction.id)).join(Partner).where(
            Partner.is_test == False,
            PartnerTransaction.status == "pending",
            PartnerTransaction.created_at >= now - timedelta(hours=24)
        ))).one() or 0

        return {
            "total_partners": total_partners, 
            "total_pro": total_pro, 
            "total_tasks": total_tasks, 
            "active_24h": active_24h,
            "active_7d": active_7d,
            "active_30d": active_30d,
            "active_90d": active_90d,
            "active_180d": active_180d,
            "pending_payments_24h": pending_payments
        }

    async def _calculate_financial_metrics(self, session) -> dict:
        """
        Calculates all financial KPIs.
        Optimization: Sums 'amount' directly from transactions for accurate USD volume,
        regardless of crypto price fluctuations after purchase.
        """
        # Rev Ton/USDT breakdown for granular view
        rev_ton_crypto = (await session.exec(select(func.sum(PartnerTransaction.amount_crypto)).join(Partner, Partner.id == PartnerTransaction.partner_id).where(
            PartnerTransaction.status == "completed", 
            PartnerTransaction.currency == "TON",
            Partner.is_test == False,
            ~PartnerTransaction.network.in_(["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"])
        ))).one() or 0.0
        rev_usdt = (await session.exec(select(func.sum(PartnerTransaction.amount)).join(Partner, Partner.id == PartnerTransaction.partner_id).where(
            PartnerTransaction.status == "completed", 
            PartnerTransaction.currency == "USDT",
            Partner.is_test == False,
            ~PartnerTransaction.network.in_(["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"])
        ))).one() or 0.0
        
        # Total Revenue in USD (Sum of all transaction amount_usd)
        total_revenue = (await session.exec(select(func.sum(PartnerTransaction.amount)).join(Partner, Partner.id == PartnerTransaction.partner_id).where(
            PartnerTransaction.status == "completed",
            Partner.is_test == False,
            ~PartnerTransaction.network.in_(["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"])
        ))).one() or 0.0
        
        # Current effective TON revenue (if we sold it all now)
        ton_price = await payment_service.get_ton_price()
        current_ton_value = rev_ton_crypto * ton_price
        
        comm_res = await session.exec(select(Earning.level, func.sum(Earning.amount)).join(Partner, Partner.id == Earning.partner_id).where(Earning.type == "COMMISSION", Earning.level.between(1, 20), Partner.is_test == False).group_by(Earning.level))
        comm_map = {lvl: amt for lvl, amt in comm_res.all()}
        
        breakdown, total_comm = [], 0.0
        for lvl in range(1, 21):
            amt = comm_map.get(lvl, 0.0)
            breakdown.append({"level": lvl, "amount": round(amt, 2)})
            total_comm += amt

        net_profit = total_revenue - total_comm
        
        # Theoretical target sum based on config (should be 56%)
        theoretical_payout = round(sum(settings.COMMISSION_MAP_GROWTH_STRATEGY.values()) * 100, 1)

        return {
            "total_revenue": round(total_revenue, 2), 
            "total_revenue_ton": round(rev_ton_crypto, 2),
            "current_ton_value": round(current_ton_value, 2),
            "total_revenue_usdt": round(rev_usdt, 2), 
            "total_commissions": round(total_comm, 2),
            "net_profit": round(net_profit, 2), 
            "gross_margin": round((net_profit / total_revenue * 100), 1) if total_revenue > 0 else 0,
            "actual_payout_ratio": round((total_comm / total_revenue * 100), 1) if total_revenue > 0 else 0,
            "theoretical_payout_ratio": theoretical_payout,
            "commissions_breakdown": breakdown
        }

    async def _calculate_daily_performance(self, session, now: datetime) -> tuple[list, list]:
        from sqlalchemy import Date, cast
        cutoff = now - timedelta(days=14)
        
        growth_res = await session.exec(select(cast(Partner.created_at, Date).label("day"), func.count(Partner.id)).where(Partner.created_at >= cutoff, Partner.is_test == False).group_by("day"))
        growth_map = {row[0]: row[1] for row in growth_res.all() if row[0]}
        
        rev_res = await session.exec(select(cast(PartnerTransaction.created_at, Date).label("day"), func.sum(PartnerTransaction.amount)).join(Partner, Partner.id == PartnerTransaction.partner_id).where(
            PartnerTransaction.status == "completed", 
            PartnerTransaction.created_at >= cutoff,
            Partner.is_test == False,
            ~PartnerTransaction.network.in_(["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"])
        ).group_by("day"))
        rev_map = {row[0]: row[1] for row in rev_res.all() if row[0]}
        
        daily_g, daily_r = [], []
        for i in range(13, -1, -1):
            day = (now - timedelta(days=i)).date()
            d_str = day.strftime("%m-%d")
            daily_g.append({"date": d_str, "count": growth_map.get(day, 0)})
            daily_r.append({"date": d_str, "amount": round(rev_map.get(day, 0.0), 2)})
        return daily_g, daily_r

    async def _calculate_recent_sales(self, session) -> list:
        # Optimized: Use selectinload to avoid N+1 queries when fetching partner details for transactions
        stmt = (
            select(PartnerTransaction)
            .join(Partner, Partner.id == PartnerTransaction.partner_id)
            .where(
                PartnerTransaction.status == "completed",
                Partner.is_test == False,
                ~PartnerTransaction.network.in_(["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"])
            )
            .options(selectinload(PartnerTransaction.partner)) 
            .order_by(PartnerTransaction.created_at.desc())
            .limit(15)
        )
        result = await session.exec(stmt)
        txs = result.all()
        
        recent = []
        for tx in txs:
            recent.append({
                "id": tx.id, "amount": tx.amount, "currency": tx.currency, "tx_hash": tx.tx_hash,
                "created_at": tx.created_at.isoformat(), 
                "username": tx.partner.username if tx.partner else None,
                "telegram_id": tx.partner.telegram_id if tx.partner else "Unknown"
            })
        return recent

    async def _calculate_task_breakdown(self, session) -> dict:
        res = await session.exec(select(PartnerTask.task_id, func.count(PartnerTask.id)).group_by(PartnerTask.task_id))
        return {tid: count for tid, count in res.all()}

    async def _calculate_viral_metrics(self, session, total_partners: int) -> dict:
        """
        Calculates viral growth indicators (K-Factor, Velocity).
        """
        # K-Factor = (Total Referrals) / (Total Partners)
        referring_partners = (await session.exec(select(func.count(func.distinct(Partner.referrer_id))).where(Partner.is_test == False))).one() or 1
        k_factor = round(total_partners / referring_partners, 2) if referring_partners > 0 else 0
        
        # Network Density (Phase 4): Average generation depth across entire network
        avg_depth = (await session.exec(select(func.avg(Partner.depth)).where(Partner.is_test == False))).one() or 1.0
        
        return {
            "k_factor": k_factor,
            "avg_depth": round(float(avg_depth), 2),
            "ref_participation": round((referring_partners / total_partners * 100), 1) if total_partners > 0 else 0
        }

    async def _perform_system_audit(self, session) -> dict:
        """
        Runs quick integrity checks on the database.
        """
        # 1. Transactions status summary
        tx_stats = await session.exec(select(PartnerTransaction.status, func.count(PartnerTransaction.id)).group_by(PartnerTransaction.status))
        tx_map = {s: c for s, c in tx_stats.all()}
        
        # 2. Orphaned partners (referrer set but path null - infrastructure bug)
        orphaned = (await session.exec(
            select(func.count(Partner.id)).where(
                Partner.referrer_id.is_not(None), 
                Partner.path.is_(None)
            )
        )).one() or 0
        
        # 3. Economy Integrity: Negative Balances or XP/Level Mismatch
        neg_balance = (await session.exec(select(func.count(Partner.id)).where(Partner.balance < 0.0))).one() or 0
        
        # Optional: verify if someone has more XP than their level suggests (usually okay, but good to flag)
        
        return {
            "transactions": tx_map,
            "orphaned_count": orphaned,
            "negative_balances": neg_balance,
            "is_healthy": orphaned == 0 and neg_balance == 0 and tx_map.get("failed", 0) < 10
        }

    def _calculate_kpis(self, totals: dict, total_revenue: float) -> dict:
        tp, tpro = totals["total_partners"], totals["total_pro"]
        
        def calc_ret(key):
            val = totals.get(key, 0)
            return round((val / tp * 100) if tp > 0 else 0, 1)

        return {
            "conversion_rate": round((tpro / tp * 100) if tp > 0 else 0, 2),
            "arpu": round((total_revenue / tp) if tp > 0 else 0, 2),
            "engagement_rate": round((totals.get("active_24h", 0) / tp * 100) if tp > 0 else 0, 1),
            "retention_7d": calc_ret("active_7d"),
            "retention_30d": calc_ret("active_30d"),
            "retention_90d": calc_ret("active_90d"),
            "retention_180d": calc_ret("active_180d"),
            "retention_estimate": calc_ret("active_7d") # Compatibility alias
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
             .where(Earning.currency != "XP", Partner.is_test == False) \
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
        Returns count of partners at each level 1-20 globally.
        CORRECTION: Now correctly uses 'depth' (referral generation) instead of XP level.
        """
        async for session in get_session():
            # Depth 1 = Level 1 Referrals, Depth 2 = Level 2, etc.
            # We filter depth 1-20 to show the 20-level tree distribution.
            stmt = select(Partner.depth, func.count(Partner.id)).where(
                Partner.depth.between(1, 20),
                Partner.is_test == False
            ).group_by(Partner.depth)
            
            result = await session.exec(stmt)
            stats = {str(i): 0 for i in range(1, 21)}
            for depth, count in result.all():
                stats[str(depth)] = count
            return stats

    async def get_global_network_members(self, depth: int) -> list[dict[str, Any]]:
        """
        Returns top 100 partners for a specific generational depth globally.
        This allows admins to audit specific levels of the global referral tree.
        """
        async for session in get_session():
            # Corrected to use 'depth' to match the generational stats logic
            stmt = select(Partner).where(Partner.depth == depth).order_by(Partner.id.desc()).limit(100)
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
                    "depth": p.depth,
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

    async def get_partner_admin_details(self, partner_id: int) -> dict[str, Any]:
        """
        Fetches a partner with ALL necessary relationships eagerly loaded for admin review.
        """
        async for session in get_session():
            stmt = select(Partner).where(Partner.id == partner_id).options(
                selectinload(Partner.completed_task_records),
                selectinload(Partner.transactions).options(selectinload(PartnerTransaction.partner))
            )
            result = await session.exec(stmt)
            partner = result.first()
            if not partner: return None
            
            return {
                "id": partner.id,
                "telegram_id": partner.telegram_id,
                "username": partner.username,
                "first_name": partner.first_name,
                "last_name": partner.last_name,
                "xp": partner.xp,
                "level": partner.level,
                "is_pro": partner.is_pro,
                "pro_tokens": partner.pro_tokens,
                "referral_count": partner.referral_count,
                "balance": partner.balance,
                "checkin_streak": partner.checkin_streak,
                "created_at": partner.created_at.isoformat(),
                "tasks": [t.task_id for t in partner.completed_task_records],
                "transactions": [
                    {
                        "id": t.id,
                        "amount": t.amount,
                        "currency": t.currency,
                        "status": t.status,
                        "created_at": t.created_at.isoformat(),
                        "tx_hash": t.tx_hash
                    } for t in partner.transactions
                ]
            }

    async def update_partner_admin(self, partner_id: int, updates: dict[str, Any]):
        """
        Applies administrative updates to a partner (Give XP, Set PRO).
        """
        async for session in get_session():
            stmt = select(Partner).where(Partner.id == partner_id).with_for_update()
            result = await session.execute(stmt)
            partner = result.scalar_one_or_none()
            if not partner: return False
            
            if "xp" in updates:
                increment = float(updates["xp"])
                partner.xp += increment
                from app.utils.ranking import get_level
                partner.level = get_level(partner.xp)
                
                # Update Leaderboard (Incremental for Seasons)
                from app.services.leaderboard_service import leaderboard_service
                await leaderboard_service.increment_score(partner.id, increment, is_test=partner.is_test)
                # Log XP transaction
                from app.models.partner import XPTransaction
                new_xp_tx = XPTransaction(
                    partner_id=partner.id,
                    amount=increment,
                    type="BONUS",
                    description="Admin Adjustment"
                )
                session.add(new_xp_tx)
                
            # Log Audit Event
            await audit_service.log_event(
                session=session,
                entity_type="partner",
                entity_id=str(partner.id),
                action="admin_update",
                actor_id="admin_dashboard",
                details=updates
            )
            
            if "is_pro" in updates:
                partner.is_pro = bool(updates["is_pro"])
                if partner.is_pro and not partner.pro_expires_at:
                    partner.pro_expires_at = datetime.now(UTC) + timedelta(days=30)
            
            session.add(partner)
            await session.commit()
            
            await redis_service.client.delete(f"partner:profile:{partner.telegram_id}")
            return True

    async def get_palantir_feed(self, limit: int = 100) -> list[dict[str, Any]]:
        """
        Retrieves the raw 'Palantir' event feed (the master activity log of the platform).
        Fetches the latest critical system activities (XP updates, commissions, upgrades, payments).
        """
        from sqlmodel import select

        from app.models.audit_log import AuditLog
        
        async for session in get_session():
            stmt = (
                select(AuditLog, Partner)
                .join(Partner, Partner.id == AuditLog.partner_id, isouter=True)
                .order_by(AuditLog.created_at.desc())
                .limit(limit)
            )
            result = await session.exec(stmt)
            rows = result.all()
            
            feed = []
            for log, partner in rows:
                action_val = str(log.action_type.value) if hasattr(log.action_type, 'value') else str(log.action_type)
                
                # Dynamic Categorization for 'MISC' or unset types
                if action_val == "MISC" and log.action:
                    if "fallback" in log.action or "admin" in log.action or "fix" in log.action:
                        action_val = "SYSTEM"
                    elif "reconciliation" in log.action or "integrity" in log.action:
                        action_val = "RECONCILIATION"

                feed.append({
                    "id": log.id,
                    "partner_id": partner.id if partner else None,
                    "action_type": action_val,
                    "action": log.action,
                    "description": log.description or log.action or "System Event",
                    "details": log.details,
                    "created_at": log.created_at.isoformat(),
                    "username": partner.username if partner else None,
                    "telegram_id": partner.telegram_id if partner else "system",
                    "partner_level": partner.level if partner else None,
                    "partner_is_pro": partner.is_pro if partner else False,
                    "partner_photo": partner.photo_url if partner else None
                })
            return feed

    async def clear_system_cache(self) -> dict[str, Any]:
        """Flushes key system caches."""
        # Clear admin stats cache in DB
        async for session in get_session():
            from app.models.partner import SystemSetting
            await session.execute(text("DELETE FROM systemsetting WHERE key = 'cache:admin_stats'"))
            await session.commit()
            
        # Clear high-level redis keys
        keys_to_clear = ["ton_price_usd", "partners:recent_v2", "global:leaderboard:v1"]
        for key in keys_to_clear:
            await redis_service.client.delete(key)
            
        return {"status": "success", "message": "Caches cleared"}

admin_service = AdminService()
