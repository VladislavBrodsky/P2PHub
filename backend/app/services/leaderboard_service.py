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
        """Updates or sets a partner's score in ALL active Redis leaderboards."""
        try:
            keys = self._get_active_keys()
            async with redis_service.client.pipeline(transaction=False) as pipe:
                for key in keys:
                    pipe.zadd(key, {str(partner_id): xp})
                await pipe.execute()
        except Exception as e:
            logger.error(f"Failed to update leaderboard score for {partner_id}: {e}")

    async def increment_score(self, partner_id: int, amount: float):
        """Increments a partner's score in ALL active Redis leaderboards."""
        try:
            keys = self._get_active_keys()
            async with redis_service.client.pipeline(transaction=False) as pipe:
                for key in keys:
                    pipe.zincrby(key, amount, str(partner_id))
                await pipe.execute()
        except Exception as e:
            logger.error(f"Failed to increment leaderboard score for {partner_id}: {e}")

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
        """Hydrates partner IDs with details from DB and maps to privacy-safe schema."""
        from app.schemas.leaderboard import LeaderboardPartner

        if not partner_ids:
            return []

        statement = select(Partner).where(Partner.id.in_(partner_ids))
        result = await session.exec(statement)
        partners = result.all()

        # Map to schema and sort by score
        hydrated = []
        for p in partners:
            # #comment: Deterministic realism injection for social proof (user request)
            # Ensures top partners always appear to have 133-437 members if actual count is low.
            display_refs = p.referral_count
            if display_refs < 133:
                display_refs = 133 + ((p.id * 17) % (437 - 133 + 1))

            item = LeaderboardPartner(
                id=p.id,
                username=p.username,
                first_name=p.first_name,
                photo_url=p.photo_url,
                photo_file_id=p.photo_file_id,
                xp=scores.get(p.id, p.xp),
                level=p.level,
                referral_count=display_refs
            )
            # #comment: Using mode='json' ensures future-proof serialization if new fields are added.
            hydrated.append(item.model_dump(mode='json'))

        hydrated.sort(key=lambda x: x['xp'], reverse=True)
        return hydrated

leaderboard_service = LeaderboardService()
