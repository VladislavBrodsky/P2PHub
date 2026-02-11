"""expand earning table

Revision ID: ead7739fcce1
Revises: 85ea8462aeec
Create Date: 2026-02-09 13:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'ead7739fcce1'
down_revision: Union[str, Sequence[str], None] = '85ea8462aeec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('earning')]

    with op.batch_alter_table('earning', schema=None) as batch_op:
        if 'type' not in columns:
            batch_op.add_column(sa.Column('type', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='COMMISSION'))
            batch_op.create_index(batch_op.f('ix_earning_type'), ['type'], unique=False)

        if 'level' not in columns:
            batch_op.add_column(sa.Column('level', sa.Integer(), nullable=True))

        if 'currency' not in columns:
            batch_op.add_column(sa.Column('currency', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='USDT'))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('earning', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_earning_type'))
        batch_op.drop_column('currency')
        batch_op.drop_column('level')
        batch_op.drop_column('type')
