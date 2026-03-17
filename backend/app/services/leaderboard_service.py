import logging

from sqlmodel import select

from app.models.partner import Partner
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

from datetime import UTC, datetime


class LeaderboardService:
    LEADERBOARD_KEY = "leaderboard:global"
    TEST_LEADERBOARD_KEY = "leaderboard:test:global"

    def _get_active_keys(self, is_test: bool = False) -> list[str]:
        """Returns the list of active leaderboard keys (Global, Monthly, Weekly)."""
        now = datetime.now(UTC)
        prefix = "leaderboard:test:" if is_test else "leaderboard:"
        
        global_key = self.TEST_LEADERBOARD_KEY if is_test else self.LEADERBOARD_KEY
        weekly_key = f"{prefix}weekly:{now.year}-{now.isocalendar()[1]}"
        monthly_key = f"{prefix}monthly:{now.year}-{now.month}"
        return [global_key, monthly_key, weekly_key]

    async def update_score(self, partner_id: int, xp: float, is_test: bool = False):
        """
        Updates the GLOBAL total score.
        """
        try:
            keys = self._get_active_keys(is_test=is_test)
            # Find the global key (first in list)
            global_key = keys[0]
            await redis_service.client.zadd(global_key, {str(partner_id): xp})
        except Exception as e:
            logger.error(f"Failed to update global score for {partner_id} (is_test={is_test}): {e}")

    async def increment_score(self, partner_id: int, amount: float, is_test: bool = False):
        """
        Increments a partner's score in ALL active Redis leaderboards.
        """
        try:
            keys = self._get_active_keys(is_test=is_test)
            async with redis_service.client.pipeline(transaction=False) as pipe:
                for key in keys:
                    pipe.zincrby(key, amount, str(partner_id))
                await pipe.execute()
        except Exception as e:
            logger.error(f"Failed to increment score for {partner_id} (is_test={is_test}): {e}")

    async def get_top_partners(self, limit: int = 50, timeframe: str = "all", is_test: bool = False) -> list[tuple[bytes, float]]:
        """Fetches the top partners for a specific timeframe."""
        try:
            keys = self._get_active_keys(is_test=is_test)
            if timeframe == "weekly":
                key = keys[2]
            elif timeframe == "monthly":
                key = keys[1]
            else:
                key = keys[0]

            # Returns list of (id, score) tuples
            return await redis_service.client.zrevrange(key, 0, limit - 1, withscores=True)
        except Exception as e:
            logger.error(f"Failed to fetch top partners for {timeframe} (is_test={is_test}): {e}")
            return []

    async def get_partner_rank(self, partner_id: int, timeframe: str = "all", is_test: bool = False) -> int | None:
        """Returns the 0-indexed rank of a partner for a timeframe."""
        try:
            keys = self._get_active_keys(is_test=is_test)
            if timeframe == "weekly":
                key = keys[2]
            elif timeframe == "monthly":
                key = keys[1]
            else:
                key = keys[0]

            rank = await redis_service.client.zrevrank(key, str(partner_id))
            return rank
        except Exception:
            return None

    async def hydrate_leaderboard(self, partner_ids: list[int], scores: dict[int, float], session) -> list[dict]:
        """
        Hydrates partner IDs with details from DB and maps to privacy-safe schema.
        #comment Phase 2 Scaling: Implemented "Cache-First" hydration. 
        Top 50 profiles are likely requested 1000s of times per minute; 
        MGET from Redis is ~50x faster than indexed DB SELECTs.
        """
        from app.schemas.leaderboard import LeaderboardPartner

        if not partner_ids:
            return []

        # 1. Try to fetch from Redis Cache first
        cached_profiles = await redis_service.get_cached_profiles(partner_ids)
        
        # 2. Identify missing IDs
        missing_ids = [pid for pid in partner_ids if pid not in cached_profiles]
        
        db_partners = []
        if missing_ids:
            # Only hit DB for what we don't have
            statement = select(Partner).where(Partner.id.in_(missing_ids))
            result = await session.exec(statement)
            db_partners = result.all()
            
            # 3. Cache the new results for next time
            new_cache_map = {}
            for p in db_partners:
                # Sanitize legacy photo URLs (e.g. /images/avatars/...)
                safe_photo_url = p.photo_url
                if safe_photo_url and (
                    safe_photo_url.startswith("/images/avatars/") or
                    safe_photo_url.startswith("/images/") or
                    safe_photo_url.startswith("/avatars/")
                ):
                    safe_photo_url = None

                p_data = {
                    "id": p.id,
                    "username": p.username,
                    "first_name": p.first_name,
                    "photo_url": safe_photo_url,
                    "photo_file_id": p.photo_file_id,
                    "level": p.level,
                    "referral_count": p.referral_count,
                    "total_earned_usdt": p.total_earned_usdt,
                    "subscription_plan": p.subscription_plan
                }
                new_cache_map[p.id] = p_data
            
            if new_cache_map:
                await redis_service.cache_profiles(new_cache_map)
                cached_profiles.update(new_cache_map)

        # 4. Map to schema and sort by score
        hydrated = []
        for pid in partner_ids:
            p_data = cached_profiles.get(pid)
            if not p_data: continue

            item = LeaderboardPartner(
                id=p_data["id"],
                username=p_data.get("username"),
                first_name=p_data.get("first_name"),
                photo_url=p_data.get("photo_url"),
                photo_file_id=p_data.get("photo_file_id"),
                xp=scores.get(pid, 0.0),
                level=p_data.get("level", 1),
                referral_count=p_data.get("referral_count", 0),
                total_earned_usdt=p_data.get("total_earned_usdt", 0.0),
                subscription_plan=p_data.get("subscription_plan")
            )
            hydrated.append(item.model_dump(mode='json'))

        # Note: We keep sorting to ensure rank order matches the score input
        hydrated.sort(key=lambda x: x['xp'], reverse=True)
        return hydrated

leaderboard_service = LeaderboardService()
