from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class BlogPostBase(BaseModel):
    slug: str
    title: str
    excerpt: str
    category: str
    author: str
    image_url: str | None = None
    published_at: datetime

class BlogPostRead(BlogPostBase):
    id: int
    likes: int = 0
    liked: bool = False

class BlogPostDetail(BlogPostRead):
    content: str

class BlogListResponse(BaseModel):
    items: list[BlogPostRead]
    total: int
    offset: int
    limit: int
