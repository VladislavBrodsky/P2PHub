from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class BlogPostEngagement(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    post_slug: str = Field(index=True, unique=True)
    base_likes: int = Field(default=0)  # Random initial likes (333-712)
    user_likes: int = Field(default=0)  # Actual likes from users
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

class PartnerBlogLike(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: Optional[int] = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    post_slug: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
