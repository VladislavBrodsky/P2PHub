"""add_is_verified_to_partner

Revision ID: 20260228_add_is_verified
Revises: 101a3eb4c65e
Create Date: 2026-02-28 16:11:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '20260228_add_is_verified'
down_revision: str | Sequence[str] | None = '101a3eb4c65e'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add is_verified column to partner table."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'is_verified' not in columns:
        with op.batch_alter_table('partner', schema=None) as batch_op:
            batch_op.add_column(
                sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('false'))
            )
            batch_op.create_index('ix_partner_is_verified', ['is_verified'], unique=False)


def downgrade() -> None:
    """Remove is_verified column from partner table."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'is_verified' in columns:
        with op.batch_alter_table('partner', schema=None) as batch_op:
            batch_op.drop_index('ix_partner_is_verified')
            batch_op.drop_column('is_verified')
