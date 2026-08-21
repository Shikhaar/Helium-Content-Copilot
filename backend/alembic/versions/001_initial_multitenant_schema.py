"""Initial multi-tenant schema migration for BrandBrew.

Revision ID: 001_initial_multitenant_schema
Revises: 
Create Date: 2026-08-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_multitenant_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── BRANDS TABLE ────────────────────────────────────────────────────────
    op.create_table(
        'brands',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('workspace_id', sa.String(), nullable=False, server_default='default_workspace'),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('tone', sa.Text(), nullable=False),
        sa.Column('audience', sa.Text(), nullable=False),
        sa.Column('campaign', sa.String(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('updated_at', sa.String(), nullable=False),
    )

    # ── PRODUCTS TABLE ──────────────────────────────────────────────────────
    op.create_table(
        'products',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('brand_id', sa.String(), sa.ForeignKey('brands.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('price_inr', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('features', sa.Text(), nullable=False),
        sa.Column('season', sa.String(), nullable=False),
        sa.Column('target_audience', sa.String(), nullable=False),
        sa.Column('inventory_status', sa.String(), nullable=False),
        sa.Column('views', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sales', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('updated_at', sa.String(), nullable=False),
    )
    op.create_index('idx_products_brand_id', 'products', ['brand_id'])

    # ── HISTORICAL POSTS TABLE ──────────────────────────────────────────────
    op.create_table(
        'historical_posts',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('brand_id', sa.String(), sa.ForeignKey('brands.id'), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('format', sa.String(), nullable=False),
        sa.Column('caption', sa.Text(), nullable=False),
        sa.Column('product_id', sa.String(), sa.ForeignKey('products.id'), nullable=True),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('audience', sa.String(), nullable=False),
        sa.Column('objective', sa.String(), nullable=False),
        sa.Column('posted_date', sa.String(), nullable=False),
        sa.Column('impressions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('likes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comments', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('shares', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('saves', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('clicks', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('conversions', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('idx_posts_brand_id', 'historical_posts', ['brand_id'])

    # ── OPPORTUNITIES TABLE ─────────────────────────────────────────────────
    op.create_table(
        'opportunities',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('brand_id', sa.String(), sa.ForeignKey('brands.id'), nullable=False),
        sa.Column('analysis_run_id', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content_angle', sa.Text(), nullable=False),
        sa.Column('audience', sa.String(), nullable=False),
        sa.Column('objective', sa.String(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('format', sa.String(), nullable=False),
        sa.Column('suggested_product_id', sa.String(), sa.ForeignKey('products.id'), nullable=True),
        sa.Column('why', sa.Text(), nullable=False),
        sa.Column('historical_signal', sa.Text(), nullable=False),
        sa.Column('product_signal', sa.Text(), nullable=False),
        sa.Column('audience_signal', sa.Text(), nullable=False),
        sa.Column('seasonal_signal', sa.Text(), nullable=False),
        sa.Column('business_signal', sa.Text(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('score_breakdown', sa.Text(), nullable=False),
        sa.Column('confidence', sa.String(), nullable=False),
        sa.Column('confidence_reason', sa.Text(), nullable=False),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('is_demo', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('idx_opps_brand_created', 'opportunities', ['brand_id', 'created_at'])

    # ── CONTENT DRAFTS TABLE ────────────────────────────────────────────────
    op.create_table(
        'content_drafts',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('brand_id', sa.String(), sa.ForeignKey('brands.id'), nullable=False),
        sa.Column('opportunity_id', sa.String(), sa.ForeignKey('opportunities.id'), nullable=True),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('format', sa.String(), nullable=False),
        sa.Column('audience', sa.String(), nullable=False),
        sa.Column('objective', sa.String(), nullable=False),
        sa.Column('slides', sa.Text(), nullable=False),
        sa.Column('caption', sa.Text(), nullable=False),
        sa.Column('cta', sa.String(), nullable=False),
        sa.Column('hashtags', sa.Text(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='draft'),
        sa.Column('scheduled_date', sa.String(), nullable=True),
        sa.Column('scheduled_time', sa.String(), nullable=True),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('updated_at', sa.String(), nullable=False),
        sa.Column('is_demo', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('idx_drafts_brand_id', 'content_drafts', ['brand_id'])

    # ── CALENDAR ENTRIES TABLE ──────────────────────────────────────────────
    op.create_table(
        'calendar_entries',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('brand_id', sa.String(), sa.ForeignKey('brands.id'), nullable=False),
        sa.Column('draft_id', sa.String(), sa.ForeignKey('content_drafts.id'), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('format', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('scheduled_datetime', sa.String(), nullable=False),
    )
    op.create_index('idx_calendar_brand_datetime', 'calendar_entries', ['brand_id', 'scheduled_datetime'])

    # ── USERS TABLE ─────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('clerk_user_id', sa.String(), unique=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=False, server_default='editor'),
        sa.Column('workspace_id', sa.String(), nullable=False, server_default='default_workspace'),
        sa.Column('created_at', sa.String(), nullable=False),
        sa.Column('updated_at', sa.String(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('users')
    op.drop_table('calendar_entries')
    op.drop_table('content_drafts')
    op.drop_table('opportunities')
    op.drop_table('historical_posts')
    op.drop_table('products')
    op.drop_table('brands')
