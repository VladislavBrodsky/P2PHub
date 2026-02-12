"""add audit_log table for transaction tracking

Revision ID: audit_log_001
Revises: 
Create Date: 2026-02-12

#comment: This migration adds the audit_log table for tracking all financial and important operations.
Audit logs are critical for compliance, debugging, and user transparency.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'audit_log_001'
down_revision = None  # Update this to your latest migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create audit_log table.
    
    #comment: This table is append-only - never update or delete records.
    All indexes are optimized for common query patterns.
    """
    op.create_table(
        'audit_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('event_category', sa.String(), nullable=False),
        sa.Column('partner_id', sa.Integer(), nullable=True),
        sa.Column('related_partner_id', sa.Integer(), nullable=True),
        sa.Column('admin_id', sa.String(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(), nullable=False),
        sa.Column('balance_before', sa.Float(), nullable=True),
        sa.Column('balance_after', sa.Float(), nullable=True),
        sa.Column('metadata', sa.String(), nullable=False),
        sa.Column('request_id', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('success', sa.Boolean(), nullable=False),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['partner_id'], ['partner.id'], ),
    )
    
    # #comment: Indexes optimized for common query patterns
    #  - Event type for filtering by operation type
    #  - Partner ID for "show me my history"
    #  - Created at for time-based queries
    #  - Request ID for tracing specific requests
    #  - Admin ID for tracking admin actions
    op.create_index('ix_audit_log_event_type', 'audit_log', ['event_type'])
    op.create_index('ix_audit_log_partner_id', 'audit_log', ['partner_id'])
    op.create_index('ix_audit_log_related_partner_id', 'audit_log', ['related_partner_id'])
    op.create_index('ix_audit_log_admin_id', 'audit_log', ['admin_id'])
    op.create_index('ix_audit_log_created_at', 'audit_log', ['created_at'])
    op.create_index('ix_audit_log_request_id', 'audit_log', ['request_id'])
    
    # #comment: Composite index for common admin query: "show failed financial transactions"
    op.create_index(
        'ix_audit_log_category_success',
        'audit_log',
        ['event_category', 'success', 'created_at'],
    )


def downgrade() -> None:
    """Drop audit_log table and its indexes."""
    op.drop_index('ix_audit_log_category_success', table_name='audit_log')
    op.drop_index('ix_audit_log_request_id', table_name='audit_log')
    op.drop_index('ix_audit_log_created_at', table_name='audit_log')
    op.drop_index('ix_audit_log_admin_id', table_name='audit_log')
    op.drop_index('ix_audit_log_related_partner_id', table_name='audit_log')
    op.drop_index('ix_audit_log_partner_id', table_name='audit_log')
    op.drop_index('ix_audit_log_event_type', table_name='audit_log')
    op.drop_table('audit_log')
