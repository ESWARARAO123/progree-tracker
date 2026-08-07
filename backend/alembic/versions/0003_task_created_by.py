"""Track who created a task.

Revision ID: 0003_task_created_by
Revises: 0002_nullable_project_tasks
Create Date: 2026-08-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0003_task_created_by"
down_revision = "0002_nullable_project_tasks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tasks",
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "tasks_created_by_fkey", "tasks", "users",
        ["created_by"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("tasks_created_by_fkey", "tasks", type_="foreignkey")
    op.drop_column("tasks", "created_by")
