import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, computed_field, model_validator


class PartnerBase(BaseModel):
    id: int | None = None
    telegram_id: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None
    photo_file_id: str | None = None
    language_code: str | None = None
    notifications_paused: bool = False

    model_config = {"from_attributes": True}

class ActiveTaskResponse(BaseModel):
    task_id: str
    status: str
    initial_metric_value: int
    started_at: datetime

    model_config = {"from_attributes": True}

class PartnerResponse(PartnerBase):
    balance: float
# #comment: total_earned is now a @computed_field derived from 'total_earned_usdt'
# to ensure the API matches the frontend contract while using optimized DB fields.
    xp: float
    level: int
    referral_code: str
    is_pro: bool
    pro_notification_seen: bool = False
    pro_tokens: int = 500
    personal_referral_link: str | None = None
    total_earned_usdt: float = 0.0 # #comment: Raw value from DB for computation
    referral_count: int = 0
# #comment: total_network_size is now a @computed_field derived from 'referral_count'
# mapping internal ORM metrics to public API response fields.
    last_checkin_at: datetime | None = None
    checkin_streak: int = 0
    created_at: datetime
    updated_at: datetime
    referrals: list[PartnerBase] | None = None
    active_tasks: list[ActiveTaskResponse] = []
    completed_tasks: list[str] = []
    completed_stages: list[int | str] = []
    is_admin: bool = False
    # #comment: Support for dynamic injection of network size from endpoint
    _network_size_real: int | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def prepare_orm_data(cls, data: Any) -> Any:
        if not isinstance(data, dict) and hasattr(data, "completed_task_records"):
            # It's a Partner ORM model
            obj = data
            
            # Use model_dump or similar to get all base fields
            # Since SQLModel objects don't always have model_dump in this context,
            # we can iterate through the schema's fields.
            result = {}
            for field_name in cls.model_fields:
                if hasattr(obj, field_name):
                    result[field_name] = getattr(obj, field_name)
            
            # Prepare the list of completed IDs from relational records
            all_completed = list(set([
                tr.task_id for tr in obj.completed_task_records 
                if tr.status == "COMPLETED" or not tr.status
            ]))
            
            # Extract active tasks
            active_tasks = [
                {
                    "task_id": tr.task_id,
                    "status": tr.status,
                    "initial_metric_value": tr.initial_metric_value,
                    "started_at": tr.started_at
                } for tr in obj.completed_task_records if tr.status == "STARTED"
            ]
            
            # Parse completed stages
            try:
                stages = json.loads(obj.completed_stages or "[]")
            except:
                stages = []

            result['completed_tasks'] = all_completed
            result['active_tasks'] = active_tasks
            result['completed_stages'] = stages
            
            # Manual mappings for computed fields if they are in model_fields
            # Pydantic v2 handles computed_fields automatically if we return a dict
            return result
        return data

    @computed_field
    @property
    def has_x_setup(self) -> bool:
        return getattr(self, "x_api_key", None) is not None

    @computed_field
    @property
    def has_telegram_setup(self) -> bool:
        return getattr(self, "telegram_channel_id", None) is not None

    @computed_field
    @property
    def has_linkedin_setup(self) -> bool:
        return getattr(self, "linkedin_access_token", None) is not None

    @computed_field
    @property
    def total_earned(self) -> float:
        return getattr(self, "total_earned_usdt", 0.0)

    @computed_field
    @property
    def total_network_size(self) -> int:
        if hasattr(self, "_network_size_real") and self._network_size_real is not None:
            return self._network_size_real
        return getattr(self, "referral_count", 0)

class PROSetupRequest(BaseModel):
    x_api_key: str | None = None
    x_api_secret: str | None = None
    x_access_token: str | None = None
    x_access_token_secret: str | None = None
    telegram_channel_id: str | None = None
    telegram_channels: list[str] | None = None
    linkedin_access_token: str | None = None
    
    # #comment: Standardized for audit.
    class Config:
        from_attributes = True

class ViralGenerateRequest(BaseModel):
    post_type: str
    target_audience: str
    language: str
    tone_of_voice: str | None = "authoritative"
    referral_link: str | None = None
    
    # #comment: Standardized for audit.
    class Config:
        from_attributes = True

class ViralGenerateResponse(BaseModel):
    id: int | None = None # Explicit generation ID for tracking
    title: str
    body: str
    hashtags: list[str] | None = None
    image_prompt: str
    image_url: str | None = None
    tokens_remaining: int
    error_code: str | None = None
    
    # #comment: Standardized for audit.
    class Config:
        from_attributes = True

class SocialPostRequest(BaseModel):
    platform: str # 'x', 'telegram', 'linkedin'
    content: str
    image_path: str | None = None
    generation_id: int | None = None
    channel_id: str | None = None  # PRO+: override which TG channel to post to
    
    # #comment: Standardized for audit.
    class Config:
        from_attributes = True

class TaskClaimRequest(BaseModel):
    xp_reward: float = Field(gt=0, description="XP reward must be greater than zero")
    
    # #comment: Standardized for audit.
    class Config:
        from_attributes = True

class NetworkStats(BaseModel):
    # Dynamic Mapping: allows level_1...level_20 without hardcoding every field
    # but still provides defaults for the most common ones for API parity.
    level_1: int = 0
    level_2: int = 0
    level_3: int = 0
    level_4: int = 0
    level_5: int = 0
    level_6: int = 0
    level_7: int = 0
    level_8: int = 0
    level_9: int = 0
    level_10: int = 0
    level_11: int = 0
    level_12: int = 0
    level_13: int = 0
    level_14: int = 0
    level_15: int = 0
    level_16: int = 0
    level_17: int = 0
    level_18: int = 0
    level_19: int = 0
    level_20: int = 0

    class Config:
        from_attributes = True
        extra = "allow" # Allow dynamic levels in the future

class GrowthMetrics(BaseModel):
    growth_pct: float
    current_count: int
    previous_count: int
    timeframe: str

    class Config:
        from_attributes = True

class EarningSchema(BaseModel):
    amount: float
    description: str
    type: str
    level: int | None = None
    currency: str
    created_at: datetime

    class Config:
        from_attributes = True

class PartnerTopResponse(BaseModel):
    id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    photo_file_id: str | None = None
    xp: float
    referrals_count: int
    rank: str

class OrbitMemberResponse(BaseModel):
    id: int
    first_name: str | None = None
    photo_file_id: str | None = None
    picture_url: str | None = None
    xp: float
    rank: str

    class Config:
        from_attributes = True

class LanguageUpdate(BaseModel):
    language_code: str
    
    # #comment: Standardized for audit.
    class Config:
        from_attributes = True

class ReferralLinkUpdate(BaseModel):
    referral_link: str
    
    # #comment: Standardized for audit.
    class Config:
        from_attributes = True

class NotificationsUpdate(BaseModel):
    notifications_paused: bool
    
    # #comment: Standardized for audit.
    class Config:
        from_attributes = True
