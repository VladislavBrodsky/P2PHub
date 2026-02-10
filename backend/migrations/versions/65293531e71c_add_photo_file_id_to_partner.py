"""add_photo_file_id_to_partner

Revision ID: 65293531e71c
Revises: 137ba628be77
Create Date: 2026-02-10 05:59:07.823448

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '65293531e71c'
down_revision: Union[str, Sequence[str], None] = '137ba628be77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check if column exists before adding
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('partner')]
    
    if 'photo_file_id' not in columns:
        op.add_column('partner', sa.Column('photo_file_id', sa.String(), nullable=True))
    else:
        print("✅ Column 'photo_file_id' already exists in 'partner' table, skipping.")


def downgrade() -> None:
    """Downgrade schema."""
    # Remove photo_file_id column
    op.drop_column('partner', 'photo_file_id')
