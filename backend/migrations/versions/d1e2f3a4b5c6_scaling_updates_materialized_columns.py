"""scaling updates materialized columns

Revision ID: d1e2f3a4b5c6
Revises: f3a8c7d6e5b4
Create Date: 2026-02-10 00:00:01.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = 'f3a8c7d6e5b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Add columns
    op.add_column('partner', sa.Column('total_earned_usdt', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('partner', sa.Column('referral_count', sa.Integer(), nullable=False, server_default='0'))
    
    # 2. Add indexes
    op.create_index(op.f('ix_partner_total_earned_usdt'), 'partner', ['total_earned_usdt'], unique=False)
    op.create_index(op.f('ix_partner_referral_count'), 'partner', ['referral_count'], unique=False)

    # 3. Initialize data (SQLAlchemy Core)
    # referral_count
    op.execute("""
        UPDATE partner 
        SET referral_count = (
            SELECT COUNT(*) FROM partner p2 WHERE p2.referrer_id = partner.id
        )
    """)
    
    # total_earned_usdt
    op.execute("""
        UPDATE partner 
        SET total_earned_usdt = COALESCE((
            SELECT SUM(amount) FROM earning e WHERE e.partner_id = partner.id AND e.currency = 'USDT'
        ), 0.0)
    """)

def downgrade() -> None:
    op.drop_index(op.f('ix_partner_referral_count'), table_name='partner')
    op.drop_index(op.f('ix_partner_total_earned_usdt'), table_name='partner')
    op.drop_column('partner', 'referral_count')
    op.drop_column('partner', 'total_earned_usdt')
