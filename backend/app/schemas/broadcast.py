from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.broadcast import AudienceFilter, BroadcastStatus


class BroadcastCreate(BaseModel):
    message_text: str
    audience_type: AudienceFilter

class BroadcastRead(BaseModel):
    id: int
    admin_id: str
    message_text: str
    audience_type: AudienceFilter
    status: BroadcastStatus
    total_targets: int
    sent_count: int
    failed_count: int
    created_at: datetime
    updated_at: datetime
