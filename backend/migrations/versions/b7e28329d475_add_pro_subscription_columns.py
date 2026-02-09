"""add pro subscription columns

Revision ID: b7e28329d475
Revises: a1b2c3d4e5f6
Create Date: 2026-02-09 08:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b7e28329d475'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if columns exist before adding to avoid duplicate errors
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'is_pro' not in columns:
        op.add_column('partner', sa.Column('is_pro', sa.Boolean(), server_default='false', nullable=False))
        op.create_index(op.f('ix_partner_is_pro'), 'partner', ['is_pro'], unique=False)
    if 'pro_expires_at' not in columns:
        op.add_column('partner', sa.Column('pro_expires_at', sa.DateTime(), nullable=True))
    if 'subscription_plan' not in columns:
        op.add_column('partner', sa.Column('subscription_plan', sqlmodel.sql.sqltypes.AutoString(), nullable=True))


def downgrade() -> None:
    op.drop_index(op.f('ix_partner_is_pro'), table_name='partner')
    op.drop_column('partner', 'subscription_plan')
    op.drop_column('partner', 'pro_expires_at')
    op.drop_column('partner', 'is_pro')
