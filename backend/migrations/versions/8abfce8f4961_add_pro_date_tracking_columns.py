"""add_pro_date_tracking_columns

Revision ID: 8abfce8f4961
Revises: 25d0bcf4d0d1
Create Date: 2026-02-09 02:40:28.435458

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '8abfce8f4961'
down_revision: Union[str, Sequence[str], None] = '25d0bcf4d0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    with op.batch_alter_table('partner', schema=None) as batch_op:
        if 'pro_purchased_at' not in columns:
            batch_op.add_column(sa.Column('pro_purchased_at', sa.DateTime(), nullable=True))
        if 'pro_started_at' not in columns:
            batch_op.add_column(sa.Column('pro_started_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    with op.batch_alter_table('partner', schema=None) as batch_op:
        if 'pro_started_at' in columns:
            batch_op.drop_column('pro_started_at')
        if 'pro_purchased_at' in columns:
            batch_op.drop_column('pro_purchased_at')
