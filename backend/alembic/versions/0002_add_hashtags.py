"""0002_add_hashtags — adds post_hashtags table.

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # checkfirst=True — safe to run even if table already exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'post_hashtags' not in inspector.get_table_names():
        op.create_table(
            'post_hashtags',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('post_id', sa.Integer(), sa.ForeignKey('micro_posts.id', ondelete='CASCADE'), nullable=False),
            sa.Column('tag', sa.String(), nullable=False),
            sa.UniqueConstraint('post_id', 'tag', name='uq_post_tag'),
        )
        op.create_index('ix_post_hashtags_tag', 'post_hashtags', ['tag'])


def downgrade() -> None:
    op.drop_index('ix_post_hashtags_tag', table_name='post_hashtags')
    op.drop_table('post_hashtags')
