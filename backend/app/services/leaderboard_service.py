import logging

from sqlmodel import select

from app.models.partner import Partner
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

from datetime import UTC, datetime

class LeaderboardService:
    LEADERBOARD_KEY = "leaderboard:global"

    def _get_active_keys(self) -> list[str]:
        """Returns the list of active leaderboard keys (Global, Monthly, Weekly)."""
        now = datetime.now(UTC)
        weekly_key = f"leaderboard:weekly:{now.year}-{now.isocalendar()[1]}"
        monthly_key = f"leaderboard:monthly:{now.year}-{now.month}"
        return [self.LEADERBOARD_KEY, monthly_key, weekly_key]

    async def update_score(self, partner_id: int, xp: float):
        """
        Updates the GLOBAL total score. 
        Note: This is usually for sync/full-set operations. 
        For seasonal accuracy, use increment_score for rewards.
        """
        try:
            await redis_service.client.zadd(self.LEADERBOARD_KEY, {str(partner_id): xp})
        except Exception as e:
            logger.error(f"Failed to update global score for {partner_id}: {e}")

    async def increment_score(self, partner_id: int, amount: float):
        """
        Increments a partner's score in ALL active Redis leaderboards (Global + Seasons).
        This is the preferred method for rewards.
        """
        try:
            keys = self._get_active_keys()
            async with redis_service.client.pipeline(transaction=False) as pipe:
                for key in keys:
                    pipe.zincrby(key, amount, str(partner_id))
                await pipe.execute()
        except Exception as e:
            logger.error(f"Failed to increment score for {partner_id}: {e}")

    async def get_top_partners(self, limit: int = 50, timeframe: str = "all") -> list[tuple[bytes, float]]:
        """Fetches the top partners for a specific timeframe (all, monthly, weekly)."""
        try:
            now = datetime.now(UTC)
            if timeframe == "weekly":
                key = f"leaderboard:weekly:{now.year}-{now.isocalendar()[1]}"
            elif timeframe == "monthly":
                key = f"leaderboard:monthly:{now.year}-{now.month}"
            else:
                key = self.LEADERBOARD_KEY

            # Returns list of (id, score) tuples
            return await redis_service.zrevrange(key, 0, limit - 1, withscores=True)
        except Exception as e:
            logger.error(f"Failed to fetch top partners for {timeframe}: {e}")
            return []

    async def get_partner_rank(self, partner_id: int, timeframe: str = "all") -> int | None:
        """Returns the 0-indexed rank of a partner for a timeframe."""
        try:
            now = datetime.now(UTC)
            if timeframe == "weekly":
                key = f"leaderboard:weekly:{now.year}-{now.isocalendar()[1]}"
            elif timeframe == "monthly":
                key = f"leaderboard:monthly:{now.year}-{now.month}"
            else:
                key = self.LEADERBOARD_KEY

            rank = await redis_service.zrevrank(key, str(partner_id))
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
                p_data = {
                    "id": p.id,
                    "username": p.username,
                    "first_name": p.first_name,
                    "photo_url": p.photo_url,
                    "photo_file_id": p.photo_file_id,
                    "level": p.level,
                    "referral_count": p.referral_count
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
                referral_count=p_data.get("referral_count", 0)
            )
            hydrated.append(item.model_dump(mode='json'))

        # Note: We keep sorting to ensure rank order matches the score input
        hydrated.sort(key=lambda x: x['xp'], reverse=True)
        return hydrated

leaderboard_service = LeaderboardService()
