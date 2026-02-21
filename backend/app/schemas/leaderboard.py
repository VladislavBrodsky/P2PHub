
from pydantic import BaseModel


class LeaderboardPartner(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = None
    photo_url: str | None = None
    photo_file_id: str | None = None
    xp: float
    level: int
    referral_count: int = 0
    subscription_plan: str | None = None

    @property
    def is_pro_plus(self) -> bool:
        plan = self.subscription_plan or ""
        return "PLUS" in plan.upper()
    
    # #comment: Standardized for audit. Allows ORM objects in hydration.
    class Config:
        from_attributes = True
