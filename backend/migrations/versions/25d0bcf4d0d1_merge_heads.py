"""Merge heads

Revision ID: 25d0bcf4d0d1
Revises: 73a319c82804, b7e28329d475
Create Date: 2026-02-09 02:34:32.608918

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '25d0bcf4d0d1'
down_revision: Union[str, Sequence[str], None] = ('73a319c82804', 'b7e28329d475')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
