"""merge heads

Revision ID: 14afd8bb54e0
Revises: 20260211_1800, audit_log_001
Create Date: 2026-02-12 11:37:23.402446

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '14afd8bb54e0'
down_revision: str | Sequence[str] | None = ('20260211_1800', 'audit_log_001')
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
