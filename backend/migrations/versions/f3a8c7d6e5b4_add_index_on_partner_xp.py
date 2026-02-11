"""add index on partner xp

Revision ID: f3a8c7d6e5b4
Revises: ead7739fcce1
Create Date: 2026-02-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f3a8c7d6e5b4'
down_revision: Union[str, Sequence[str], None] = 'ead7739fcce1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_index(op.f('ix_partner_xp'), 'partner', ['xp'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_partner_xp'), table_name='partner')
