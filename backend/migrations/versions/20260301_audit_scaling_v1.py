"""audit_scaling_v1

Revision ID: 20260301_audit_scaling_v1
Revises: 20260228_add_is_verified
Create Date: 2026-03-01 17:40:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '20260301_audit_scaling_v1'
down_revision: Union[str, Sequence[str], None] = '20260228_add_is_verified'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add columns to audit_log
    op.add_column('audit_log', sa.Column('amount', sa.Float(), nullable=True))
    op.add_column('audit_log', sa.Column('level', sa.Integer(), nullable=True))
    
    # 2. Add indexes
    op.create_index('ix_audit_log_amount', 'audit_log', ['amount'], unique=False)
    op.create_index('ix_audit_log_level', 'audit_log', ['level'], unique=False)
    op.create_index('idx_audit_type_created', 'audit_log', ['action_type', 'created_at'], unique=False)
    
    # 3. Add index to partnertransaction
    op.create_index('idx_tx_status_created', 'partnertransaction', ['status', 'created_at'], unique=False)

    # 4. Backfill AuditLog data
    # We use a raw SQL UPDATE for performance
    op.execute(\"\"\"
        UPDATE audit_log 
        SET amount = (details->>'amount')::float, 
            level = (details->>'level')::int
        WHERE action_type IN ('COMMISSION', 'XP_AWARD', 'PAYMENT') 
          AND (details->>'amount' IS NOT NULL OR details->>'level' IS NOT NULL)
    \"\"\")
    
    # 5. Refresh the auditlog view (it might be used by external analytics)
    op.execute("DROP VIEW IF EXISTS auditlog")
    op.execute("CREATE VIEW auditlog AS SELECT * FROM audit_log")

def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS auditlog")
    op.drop_index('idx_tx_status_created', table_name='partnertransaction')
    op.drop_index('idx_audit_type_created', table_name='audit_log')
    op.drop_index('ix_audit_log_level', table_name='audit_log')
    op.drop_index('ix_audit_log_amount', table_name='audit_log')
    op.drop_column('audit_log', 'level')
    op.drop_column('audit_log', 'amount')
    op.execute("CREATE VIEW auditlog AS SELECT * FROM audit_log")
