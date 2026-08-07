"""Allow tasks without a project ("Others").

Revision ID: 0002_allow_nullable_project_tasks
Revises: 0001_initial
Create Date: 2026-08-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_nullable_project_tasks"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "tasks",
        "project_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM tasks WHERE project_id IS NULL"
    )
    op.alter_column(
        "tasks",
        "project_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
