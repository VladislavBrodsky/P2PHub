"""fix_audit_log_defaults

Revision ID: 5022d21e125a
Revises: 3233d26ec252
Create Date: 2026-02-21 16:47:26.989390

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5022d21e125a'
down_revision: Union[str, Sequence[str], None] = '3233d26ec252'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Add DEFAULT now() to audit_log.created_at
    op.execute('ALTER TABLE audit_log ALTER COLUMN created_at SET DEFAULT now()')
    
    # 2. Add DEFAULT now() to partner.created_at
    op.execute('ALTER TABLE partner ALTER COLUMN created_at SET DEFAULT now()')

    # 3. Create a view alias for auditlog to fix external queries
    op.execute('CREATE OR REPLACE VIEW auditlog AS SELECT * FROM audit_log')


def downgrade() -> None:
    """Downgrade schema."""
    # 1. Remove the view alias
    op.execute('DROP VIEW IF EXISTS auditlog')
    
    # 2. Remove defaults
    op.execute('ALTER TABLE audit_log ALTER COLUMN created_at DROP DEFAULT')
    op.execute('ALTER TABLE partner ALTER COLUMN created_at DROP DEFAULT')

