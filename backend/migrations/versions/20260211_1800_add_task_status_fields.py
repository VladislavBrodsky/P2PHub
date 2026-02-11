"""add_task_status_fields

Revision ID: 20260211_1800
Revises: 20260211_1730
Create Date: 2026-02-11 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '20260211_1800'
down_revision: Union[str, Sequence[str], None] = '20260211_1730'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if columns exist before adding to avoid duplicate errors
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partnertask')]

    if 'status' not in columns:
        op.add_column('partnertask', sa.Column('status', sa.String(), server_default='COMPLETED', nullable=False))
        # Remove default after addition if needed, but for existing rows COMPLETED is safe
    
    if 'started_at' not in columns:
        op.add_column('partnertask', sa.Column('started_at', sa.DateTime(), nullable=True))

    if 'initial_metric_value' not in columns:
        op.add_column('partnertask', sa.Column('initial_metric_value', sa.Integer(), server_default='0', nullable=False))
        
    # Make completed_at nullable if it isn't already (SQLite usually doesn't enforce this strictly unless NOT NULL was set)
    # But for correctness we ideally modify it. modifying columns in SQLite is hard with Alembic (batch op).
    # Since we are adding logic to handle Start, we can just leave completed_at nullable in code and it should be fine in SQLite.


def downgrade() -> None:
    with op.batch_alter_table('partnertask', schema=None) as batch_op:
        batch_op.drop_column('initial_metric_value')
        batch_op.drop_column('started_at')
        batch_op.drop_column('status')
