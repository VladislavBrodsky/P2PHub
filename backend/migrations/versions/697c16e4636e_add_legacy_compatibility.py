"""add legacy compatibility columns and view

Revision ID: 697c16e4636e
Revises: 3577c7444ec3
Create Date: 2026-03-20 00:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '697c16e4636e'
down_revision: Union[str, None] = '3577c7444ec3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'plan' column as a generated stored column
    # mirrors subscription_plan
    try:
        op.add_column('partner', sa.Column('plan', sa.Text(), sa.Computed("subscription_plan", persisted=True)))
    except Exception as e:
        print(f"Adding 'plan' column failed: {e}")

    # Add 'is_pro_plus' column as a generated stored column
    try:
        op.add_column('partner', sa.Column('is_pro_plus', sa.Boolean(), sa.Computed("subscription_plan LIKE 'PRO_PLUS%'", persisted=True)))
    except Exception as e:
        print(f"Adding 'is_pro_plus' column failed: {e}")
    
    # Create 'partners' VIEW as an alias for 'partner'
    try:
        op.execute("CREATE VIEW partners AS SELECT * FROM partner")
    except Exception as e:
        print(f"Creating 'partners' view failed: {e}")


def downgrade() -> None:
    try:
        op.execute("DROP VIEW IF EXISTS partners")
    except Exception:
        pass
    try:
        op.drop_column('partner', 'is_pro_plus')
    except Exception:
        pass
    try:
        op.drop_column('partner', 'plan')
    except Exception:
        pass
