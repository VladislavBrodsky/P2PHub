"""add pinterest and threads social tokens

Revision ID: 3233d26ec252
Revises: 596594295c49
Create Date: 2026-02-21 15:24:35.821312

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '3233d26ec252'
down_revision: str | Sequence[str] | None = '596594295c49'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('partner', sa.Column('pinterest_access_token', sa.String(), nullable=True))
    op.add_column('partner', sa.Column('threads_access_token', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('partner', 'threads_access_token')
    op.drop_column('partner', 'pinterest_access_token')
