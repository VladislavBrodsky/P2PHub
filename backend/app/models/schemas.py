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

class ActiveTaskResponse(BaseModel):
    task_id: str
    status: str
    initial_metric_value: int
    started_at: datetime

class PartnerResponse(PartnerBase):
    balance: float
    total_earned: Optional[float] = 0.0  # Sum of all PRO commissions and earnings
    xp: float
    level: int
    referral_code: str
    is_pro: bool
    pro_notification_seen: bool = False
    pro_tokens: int = 500
    total_network_size: int = 0
    last_checkin_at: Optional[datetime] = None
    checkin_streak: int = 0
    created_at: datetime
    updated_at: datetime
    referrals: Optional[List[PartnerBase]] = None
    active_tasks: Optional[List["ActiveTaskResponse"]] = None
    
    # Social Setup Status (not returning keys themselves for safety)
    has_x_setup: bool = False
    has_telegram_setup: bool = False
    has_linkedin_setup: bool = False

    class Config:
        from_attributes = True

class PROSetupRequest(BaseModel):
    x_api_key: Optional[str] = None
    x_api_secret: Optional[str] = None
    x_access_token: Optional[str] = None
    x_access_token_secret: Optional[str] = None
    telegram_channel_id: Optional[str] = None
    linkedin_access_token: Optional[str] = None

class ViralGenerateRequest(BaseModel):
    post_type: str
    target_audience: str
    language: str
    referral_link: Optional[str] = None

class ViralGenerateResponse(BaseModel):
    title: str
    body: str
    hashtags: Optional[List[str]] = None
    image_prompt: str
    tokens_remaining: int

class SocialPostRequest(BaseModel):
    platform: str # 'x', 'telegram', 'linkedin'
    content: str
    image_path: Optional[str] = None

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
