"""add depth and path columns to partner

Revision ID: fix_depth_001
Revises: audit_log_001
Create Date: 2026-02-12 23:00:00.000000

"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'fix_depth_001'
down_revision: Union[str, Sequence[str], None] = 'audit_log_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if columns exist before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'depth' not in columns:
        print("🛠 Adding 'depth' column to partner table...")
        op.add_column('partner', sa.Column('depth', sa.Integer(), server_default='0', nullable=False))
        op.create_index(op.f('ix_partner_depth'), 'partner', ['depth'], unique=False)
    
    if 'path' not in columns:
        print("🛠 Adding 'path' column to partner table...")
        op.add_column('partner', sa.Column('path', sa.String(), nullable=True))
        op.create_index(op.f('ix_partner_path'), 'partner', ['path'], unique=False)


def downgrade() -> None:
    # Check for columns before dropping to avoid errors if they were already gone or added manually
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'path' in columns:
        op.drop_index(op.f('ix_partner_path'), table_name='partner')
        op.drop_column('partner', 'path')

    if 'depth' in columns:
        op.drop_index(op.f('ix_partner_depth'), table_name='partner')
        op.drop_column('partner', 'depth')
