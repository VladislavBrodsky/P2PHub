from datetime import datetime

from sqlmodel import Field, SQLModel


class BlogPost(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: int | None = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True)
    title_en: str
    title_ru: str | None = None
    excerpt_en: str
    excerpt_ru: str | None = None
    content_en: str = Field(default="")
    content_ru: str | None = None
    category: str = Field(index=True)
    author: str = Field(default="Pinto Team")
    image_url: str | None = None
    is_published: bool = Field(default=True)
    published_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

class BlogPostEngagement(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: int | None = Field(default=None, primary_key=True)
    post_slug: str = Field(index=True, unique=True)
    base_likes: int = Field(default=0)  # Random initial likes (333-712)
    user_likes: int = Field(default=0)  # Actual likes from users
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

class PartnerBlogLike(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    id: int | None = Field(default=None, primary_key=True)
    partner_id: int = Field(foreign_key="partner.id", index=True)
    post_slug: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
