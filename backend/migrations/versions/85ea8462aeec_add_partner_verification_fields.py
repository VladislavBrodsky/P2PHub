"""add_partner_verification_fields

Revision ID: 85ea8462aeec
Revises: 8abfce8f4961
Create Date: 2026-02-09 02:42:57.471874

"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '85ea8462aeec'
down_revision: Union[str, Sequence[str], None] = '8abfce8f4961'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Handle transaction table
    if 'transaction' not in tables:
        op.create_table('transaction',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('partner_id', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('currency', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('network', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('tx_hash', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(['partner_id'], ['partner.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        with op.batch_alter_table('transaction', schema=None) as batch_op:
            batch_op.create_index(batch_op.f('ix_transaction_partner_id'), ['partner_id'], unique=False)
            batch_op.create_index(batch_op.f('ix_transaction_tx_hash'), ['tx_hash'], unique=False)

    # 2. Handle partner table columns
    columns = [c['name'] for c in inspector.get_columns('partner')]

    with op.batch_alter_table('partner', schema=None) as batch_op:
        if 'last_transaction_id' not in columns:
            batch_op.add_column(sa.Column('last_transaction_id', sa.Integer(), nullable=True))
            batch_op.create_foreign_key('fk_partner_last_transaction', 'transaction', ['last_transaction_id'], ['id'])

        if 'payment_details' not in columns:
            batch_op.add_column(sa.Column('payment_details', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

        # These might be detected as missing if previous migrations were skipped or failed on SQLite
        if 'path' not in columns:
            batch_op.add_column(sa.Column('path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
            batch_op.create_index(batch_op.f('ix_partner_path'), ['path'], unique=False)

        if 'updated_at' not in columns:
            batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text("'2026-01-01 00:00:00'") if op.get_context().dialect.name == 'sqlite' else sa.func.now()))
            batch_op.create_index(batch_op.f('ix_partner_updated_at'), ['updated_at'], unique=False)

        if 'completed_tasks' not in columns:
            batch_op.add_column(sa.Column('completed_tasks', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='[]'))


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]

    with op.batch_alter_table('partner', schema=None) as batch_op:
        if 'payment_details' in columns:
            batch_op.drop_column('payment_details')
        if 'last_transaction_id' in columns:
            batch_op.drop_constraint('fk_partner_last_transaction', type_='foreignkey')
            batch_op.drop_column('last_transaction_id')

    # We don't drop transaction table or other columns here to avoid accidental data loss in case of shared state
