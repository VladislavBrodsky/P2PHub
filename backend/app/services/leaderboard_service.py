import logging
from typing import List, Dict, Optional
from app.services.redis_service import redis_service
from sqlmodel import select
from app.models.partner import Partner

logger = logging.getLogger(__name__)

class LeaderboardService:
    LEADERBOARD_KEY = "leaderboard:global"

    async def update_score(self, partner_id: int, xp: float):
        """Updates or sets a partner's score in the Redis leaderboard."""
        try:
            await redis_service.client.zadd(self.LEADERBOARD_KEY, {str(partner_id): xp})
        except Exception as e:
            logger.error(f"Failed to update leaderboard score for {partner_id}: {e}")

    async def increment_score(self, partner_id: int, amount: float):
        """Increments a partner's score in the Redis leaderboard."""
        try:
            await redis_service.zincrby(self.LEADERBOARD_KEY, amount, str(partner_id))
        except Exception as e:
            logger.error(f"Failed to increment leaderboard score for {partner_id}: {e}")

    async def get_top_partners(self, limit: int = 50) -> List[Dict]:
        """Fetches the top partners from the Redis leaderboard."""
        try:
            # Returns list of (id, score) tuples
            top_ids_with_scores = await redis_service.zrevrange(self.LEADERBOARD_KEY, 0, limit - 1)
            return top_ids_with_scores
        except Exception as e:
            logger.error(f"Failed to fetch top partners: {e}")
            return []

    async def get_partner_rank(self, partner_id: int) -> Optional[int]:
        """Returns the 0-indexed rank of a partner (0 is top)."""
        try:
            rank = await redis_service.zrevrank(self.LEADERBOARD_KEY, str(partner_id))
            return rank
        except Exception:
            return None

    async def hydrate_leaderboard(self, partner_ids: List[int], scores: Dict[int, float], session) -> List[Dict]:
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
            item = LeaderboardPartner(
                id=p.id,
                username=p.username,
                first_name=p.first_name,
                photo_url=p.photo_url,
                xp=scores.get(p.id, p.xp),
                level=p.level
            )
            hydrated.append(item.model_dump())
            
        hydrated.sort(key=lambda x: x['xp'], reverse=True)
        return hydrated

leaderboard_service = LeaderboardService()
