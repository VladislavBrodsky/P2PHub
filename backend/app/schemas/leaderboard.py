from pydantic import BaseModel
from typing import Optional

class LeaderboardPartner(BaseModel):
    id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    photo_url: Optional[str] = None
    xp: float
    level: int
