"""add idempotent xp index

Revision ID: head_index_fix
Revises: d1e2f3a4b5c6
Create Date: 2026-02-10 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'head_index_fix'
down_revision: Union[str, Sequence[str], None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Get database connection
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    # Check if index exists on the 'partner' table
    tables = inspector.get_table_names()
    if 'partner' not in tables:
        print("Table 'partner' does not exist, skipping index creation.")
        return

    indexes = inspector.get_indexes('partner')
    index_names = [idx['name'] for idx in indexes]

    if 'ix_partner_xp' not in index_names:
        print("🛠 Creating index ix_partner_xp on partner(xp)...")
        op.create_index(op.f('ix_partner_xp'), 'partner', ['xp'], unique=False)
    else:
        print("✅ Index ix_partner_xp already exists.")

def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)

    indexes = inspector.get_indexes('partner')
    index_names = [idx['name'] for idx in indexes]

    if 'ix_partner_xp' in index_names:
        op.drop_index(op.f('ix_partner_xp'), table_name='partner')
