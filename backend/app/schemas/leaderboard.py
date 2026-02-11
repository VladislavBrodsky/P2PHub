from typing import Optional

from pydantic import BaseModel


class LeaderboardPartner(BaseModel):
    id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    photo_url: Optional[str] = None
    photo_file_id: Optional[str] = None
    xp: float
    level: int
