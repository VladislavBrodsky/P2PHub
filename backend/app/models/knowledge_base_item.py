from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel, JSON

class KnowledgeBaseItem(SQLModel, table=True):
    """
    Self-learning knowledge base for the CMO Agent.
    Stores insights, rules, and triggers derived from successful posts.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    category: str = Field(index=True)  # e.g., "universal_rules", "psychological_triggers", "formatting_precision"
    key: str = Field(index=True)       # e.g., "active_voice", "scarcity", "bold_usage"
    value: str                         # The actual rule or insight content
    confidence_score: float = Field(default=1.0)  # 0.0 to 1.0, affects usage probability
    source: str = Field(default="system")         # "system", "feedback_loop", "manual_override"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
