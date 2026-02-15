import json
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field, computed_field, field_validator


class PartnerBase(BaseModel):
    id: int | None = None
    telegram_id: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None
    photo_file_id: str | None = None
    language_code: str | None = None

    # #comment: CRITICAL for Pydantic v2. This allows ORM objects to be used 
    # when validating this model, specifically for nested lists like 'referrals'.
    class Config:
        from_attributes = True

class ActiveTaskResponse(BaseModel):
    task_id: str
    status: str
    initial_metric_value: int
    started_at: datetime

    class Config:
        from_attributes = True

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
    referral_count: int = 0
# #comment: total_network_size is now a @computed_field derived from 'referral_count'
# mapping internal ORM metrics to public API response fields.
    last_checkin_at: datetime | None = None
    checkin_streak: int = 0
    created_at: datetime
    updated_at: datetime
    referrals: list[PartnerBase] | None = None
    active_tasks: list[ActiveTaskResponse] = []
    completed_tasks: str = "[]"
    completed_stages: list[int | str] = []
    is_admin: bool = False

    class Config:
        from_attributes = True

    @field_validator("active_tasks", mode="before")
    @classmethod
    def map_active_tasks(cls, v, info: Any):
        # info.data will contain other fields if already validated
        # but since this is mode='before', we check if v is an ORM object
        if hasattr(v, "completed_task_records"):
             return [
                 ActiveTaskResponse(
                     task_id=tr.task_id,
                     status=tr.status,
                     initial_metric_value=tr.initial_metric_value,
                     started_at=tr.started_at
                 ) for tr in v.completed_task_records if tr.status == "STARTED"
             ]
        return v if isinstance(v, list) else []

    @field_validator("completed_tasks", mode="before")
    @classmethod
    def parse_tasks_json(cls, v, info: Any):
        if hasattr(v, "completed_task_records"):
            ids = [tr.task_id for tr in v.completed_task_records if tr.status == "COMPLETED" or not tr.status]
            return json.dumps(ids)
        return v if isinstance(v, str) else "[]"

    @field_validator("completed_stages", mode="before")
    @classmethod
    def parse_stages_json(cls, v):
        if hasattr(v, "completed_stages"): # If it's the model
             v = v.completed_stages
        if isinstance(v, str):
            try:
                raw = json.loads(v)
                return [s for s in raw if isinstance(s, (int, str))]
            except:
                return []
        return v if isinstance(v, list) else []

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
        return getattr(self, "referral_count", 0)

class PROSetupRequest(BaseModel):
    x_api_key: str | None = None
    x_api_secret: str | None = None
    x_access_token: str | None = None
    x_access_token_secret: str | None = None
    telegram_channel_id: str | None = None
    linkedin_access_token: str | None = None

class ViralGenerateRequest(BaseModel):
    post_type: str
    target_audience: str
    language: str
    referral_link: str | None = None

class ViralGenerateResponse(BaseModel):
    title: str
    body: str
    hashtags: list[str] | None = None
    image_prompt: str
    image_url: str | None = None
    tokens_remaining: int
    error_code: str | None = None

class SocialPostRequest(BaseModel):
    platform: str # 'x', 'telegram', 'linkedin'
    content: str
    image_path: str | None = None

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

    class Config:
        from_attributes = True

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

    # #comment: Required for leaderboard service mappings from ORM.
    class Config:
        from_attributes = True

class LanguageUpdate(BaseModel):
    language_code: str
