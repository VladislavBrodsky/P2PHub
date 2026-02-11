from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class PartnerBase(BaseModel):
    id: Optional[int] = None
    telegram_id: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    photo_file_id: Optional[str] = None

class PartnerResponse(PartnerBase):
    balance: float
    total_earned: Optional[float] = 0.0  # Sum of all PRO commissions and earnings
    xp: float
    level: int
    referral_code: str
    is_pro: bool
    pro_notification_seen: bool = False
    total_network_size: int = 0
    last_checkin_at: Optional[datetime] = None
    checkin_streak: int = 0
    created_at: datetime
    updated_at: datetime
    referrals: Optional[List[PartnerBase]] = None


    class Config:
        from_attributes = True

class TaskClaimRequest(BaseModel):
    xp_reward: float = Field(gt=0, description="XP reward must be greater than zero")

class NetworkStats(BaseModel):
    level_1: int = 0
    level_2: int = 0
    level_3: int = 0
    level_4: int = 0
    level_5: int = 0
    level_6: int = 0
    level_7: int = 0
    level_8: int = 0
    level_9: int = 0

class GrowthMetrics(BaseModel):
    growth_pct: float
    current_count: int
    previous_count: int
    timeframe: str

class EarningSchema(BaseModel):
    amount: float
    description: str
    type: str
    level: Optional[int] = None
    currency: str
    created_at: datetime

    class Config:
        from_attributes = True

class PartnerTopResponse(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    photo_file_id: Optional[str] = None
    xp: float
    referrals_count: int
    rank: str
