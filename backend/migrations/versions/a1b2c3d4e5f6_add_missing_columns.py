"""add_missing_columns

Revision ID: a1b2c3d4e5f6
Revises: 9fbdb7e7c0f5
Create Date: 2026-02-08 02:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9fbdb7e7c0f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if columns exist before adding to avoid duplicate errors if db was partially migrated
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'language_code' not in columns:
        op.add_column('partner', sa.Column('language_code', sqlmodel.sql.sqltypes.AutoString(), server_default='en', nullable=False))
    if 'xp' not in columns:
        op.add_column('partner', sa.Column('xp', sa.Float(), server_default='0.0', nullable=False))
    if 'level' not in columns:
        op.add_column('partner', sa.Column('level', sa.Integer(), server_default='1', nullable=False))
    if 'referral_code' not in columns:
        op.add_column('partner', sa.Column('referral_code', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.create_unique_constraint(None, 'partner', ['referral_code'])


def downgrade() -> None:
    op.drop_constraint(None, 'partner', type_='unique')
    op.drop_column('partner', 'referral_code')
    op.drop_column('partner', 'level')
    op.drop_column('partner', 'xp')
    op.drop_column('partner', 'language_code')
