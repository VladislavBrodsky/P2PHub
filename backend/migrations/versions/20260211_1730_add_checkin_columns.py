"""add_checkin_columns

Revision ID: 20260211_1730
Revises: 65293531e71c
Create Date: 2026-02-11 17:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '20260211_1730'
down_revision: Union[str, Sequence[str], None] = '65293531e71c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if columns exist before adding to avoid duplicate errors
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'last_checkin_at' not in columns:
        op.add_column('partner', sa.Column('last_checkin_at', sa.DateTime(), nullable=True))
        op.create_index(op.f('ix_partner_last_checkin_at'), 'partner', ['last_checkin_at'], unique=False)
    
    if 'checkin_streak' not in columns:
        op.add_column('partner', sa.Column('checkin_streak', sa.Integer(), server_default='0', nullable=False))
        op.create_index(op.f('ix_partner_checkin_streak'), 'partner', ['checkin_streak'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_partner_checkin_streak'), table_name='partner')
    op.drop_column('partner', 'checkin_streak')
    op.drop_index(op.f('ix_partner_last_checkin_at'), table_name='partner')
    op.drop_column('partner', 'last_checkin_at')
