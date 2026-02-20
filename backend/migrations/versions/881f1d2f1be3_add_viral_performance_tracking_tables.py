"""add viral_performance_tracking_tables

Revision ID: 881f1d2f1be3
Revises: 259e84033b1c
Create Date: 2026-02-19 20:46:00.987959

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '881f1d2f1be3'
down_revision: str | Sequence[str] | None = '259e84033b1c'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # ViralGeneration Table
    op.create_table(
        'viralgeneration',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('partner_id', sa.Integer(), nullable=False),
        sa.Column('topic', sa.String(), nullable=False),
        sa.Column('audience', sa.String(), nullable=False),
        sa.Column('language', sa.String(), nullable=False),
        sa.Column('tone', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.String(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['partner_id'], ['partner.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_viral_gen_partner_created', 'viralgeneration', ['partner_id', 'created_at'], unique=False)

    # SocialPost Table
    op.create_table(
        'socialpost',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('generation_id', sa.Integer(), nullable=True),
        sa.Column('partner_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('external_id', sa.String(), nullable=False),
        sa.Column('channel_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_metric_check', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['generation_id'], ['viralgeneration.id'], ),
        sa.ForeignKeyConstraint(['partner_id'], ['partner.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_social_post_gen_platform', 'socialpost', ['generation_id', 'platform'], unique=False)
    op.create_index(op.f('ix_socialpost_external_id'), 'socialpost', ['external_id'], unique=False)
    op.create_index(op.f('ix_socialpost_platform'), 'socialpost', ['platform'], unique=False)

    # SocialPostMetric Table
    op.create_table(
        'socialpostmetric',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('views', sa.Integer(), nullable=False),
        sa.Column('likes', sa.Integer(), nullable=False),
        sa.Column('reposts', sa.Integer(), nullable=False),
        sa.Column('replies', sa.Integer(), nullable=False),
        sa.Column('engagement_rate', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['socialpost.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_socialpostmetric_post_id'), 'socialpostmetric', ['post_id'], unique=False)
    op.create_index(op.f('ix_socialpostmetric_timestamp'), 'socialpostmetric', ['timestamp'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('socialpostmetric')
    op.drop_table('socialpost')
    op.drop_table('viralgeneration')
