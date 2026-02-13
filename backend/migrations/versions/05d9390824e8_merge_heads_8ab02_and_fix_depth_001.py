"""merge heads 8ab02 and fix_depth_001

Revision ID: 05d9390824e8
Revises: 8ab02cccd9ed, fix_depth_001
Create Date: 2026-02-12 23:07:58.727482

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '05d9390824e8'
down_revision: Union[str, Sequence[str], None] = ('8ab02cccd9ed', 'fix_depth_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
