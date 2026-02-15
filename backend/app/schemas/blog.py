from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class BlogPostBase(BaseModel):
    slug: str
    title: str
    excerpt: str
    category: str
    author: str
    image_url: Optional[str] = None
    published_at: datetime

class BlogPostRead(BlogPostBase):
    id: int
    likes: int = 0
    liked: bool = False

class BlogPostDetail(BlogPostRead):
    content: str

class BlogListResponse(BaseModel):
    items: List[BlogPostRead]
    total: int
    offset: int
    limit: int
