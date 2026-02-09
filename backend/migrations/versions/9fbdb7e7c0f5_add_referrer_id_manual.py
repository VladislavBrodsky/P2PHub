"""add_referrer_id_manual

Revision ID: 9fbdb7e7c0f5
Revises: 0ef95c8f787d
Create Date: 2026-02-07 23:52:39.962256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fbdb7e7c0f5'
down_revision: Union[str, Sequence[str], None] = '0ef95c8f787d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]
    
    if 'referrer_id' not in columns:
        op.add_column('partner', sa.Column('referrer_id', sa.Integer(), nullable=True))
        op.create_foreign_key(None, 'partner', 'partner', ['referrer_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'referrer_id' in columns:
        op.drop_constraint(None, 'partner', type_='foreignkey')
        op.drop_column('partner', 'referrer_id')
