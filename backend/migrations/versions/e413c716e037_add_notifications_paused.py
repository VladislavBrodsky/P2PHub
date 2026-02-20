"""Add notifications_paused

Revision ID: e413c716e037
Revises: 881f1d2f1be3
Create Date: 2026-02-20 14:11:16.822425

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e413c716e037'
down_revision: Union[str, Sequence[str], None] = '881f1d2f1be3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('partner', schema=None) as batch_op:
        batch_op.add_column(sa.Column('notifications_paused', sa.Boolean(), server_default='false', nullable=False))
        batch_op.create_index(batch_op.f('ix_partner_notifications_paused'), ['notifications_paused'], unique=False)

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('partner', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_partner_notifications_paused'))
        batch_op.drop_column('notifications_paused')
