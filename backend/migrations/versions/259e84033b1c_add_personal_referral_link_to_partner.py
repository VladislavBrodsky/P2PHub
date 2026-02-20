"""add personal_referral_link to partner

Revision ID: 259e84033b1c
Revises: 7f650437f795
Create Date: 2026-02-19 20:29:05.137038

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '259e84033b1c'
down_revision: Union[str, Sequence[str], None] = '7f650437f795'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'personal_referral_link' not in columns:
        with op.batch_alter_table('partner', schema=None) as batch_op:
            batch_op.add_column(sa.Column('personal_referral_link', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    if 'personal_referral_link' in columns:
        with op.batch_alter_table('partner', schema=None) as batch_op:
            batch_op.drop_column('personal_referral_link')
