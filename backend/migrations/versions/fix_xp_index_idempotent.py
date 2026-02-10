"""fix_xp_index_idempotent

Revision ID: fix_xp_index_v2
Revises: ead7739fcce1
Create Date: 2026-02-10 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'fix_xp_index_v2'
down_revision: Union[str, Sequence[str], None] = 'ead7739fcce1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Get database connection
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    
    # Check if index exists
    indexes = inspector.get_indexes('partner')
    index_names = [idx['name'] for idx in indexes]
    
    if 'ix_partner_xp' not in index_names:
        op.create_index(op.f('ix_partner_xp'), 'partner', ['xp'], unique=False)
    else:
        print("Skipping ix_partner_xp creation, already exists.")


def downgrade() -> None:
    # Get database connection
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    
    # Check if index exists
    indexes = inspector.get_indexes('partner')
    index_names = [idx['name'] for idx in indexes]

    if 'ix_partner_xp' in index_names:
        op.drop_index(op.f('ix_partner_xp'), table_name='partner')
