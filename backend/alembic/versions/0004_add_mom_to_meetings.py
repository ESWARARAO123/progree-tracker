"""add mom column to meetings

Revision ID: 0004_add_mom_to_meetings
Revises: 0003_task_created_by
Create Date: 2026-09-08

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_add_mom_to_meetings"
down_revision = "0003_task_created_by"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE meetings ADD COLUMN IF NOT EXISTS mom TEXT;")


def downgrade() -> None:
    op.execute("ALTER TABLE meetings DROP COLUMN IF EXISTS mom;")