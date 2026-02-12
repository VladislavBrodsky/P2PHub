"""add pro dashboard and social api columns

Revision ID: 8ab02cccd9ed
Revises: 14afd8bb54e0
Create Date: 2026-02-12 13:50:33.184978

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8ab02cccd9ed'
down_revision: Union[str, Sequence[str], None] = '14afd8bb54e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add PRO tokens columns
    op.add_column('partner', sa.Column('pro_tokens', sa.Integer(), nullable=False, server_default='500'))
    op.add_column('partner', sa.Column('pro_tokens_last_reset', sa.DateTime(), nullable=False, server_default=sa.text('now()')))
    
    # Add Social API columns
    op.add_column('partner', sa.Column('x_api_key', sa.String(), nullable=True))
    op.add_column('partner', sa.Column('x_api_secret', sa.String(), nullable=True))
    op.add_column('partner', sa.Column('x_access_token', sa.String(), nullable=True))
    op.add_column('partner', sa.Column('x_access_token_secret', sa.String(), nullable=True))
    op.add_column('partner', sa.Column('telegram_channel_id', sa.String(), nullable=True))
    op.add_column('partner', sa.Column('linkedin_access_token', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('partner', 'linkedin_access_token')
    op.drop_column('partner', 'telegram_channel_id')
    op.drop_column('partner', 'x_access_token_secret')
    op.drop_column('partner', 'x_access_token')
    op.drop_column('partner', 'x_api_secret')
    op.drop_column('partner', 'x_api_key')
    op.drop_column('partner', 'pro_tokens_last_reset')
    op.drop_column('partner', 'pro_tokens')
