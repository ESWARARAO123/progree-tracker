import uuid

from sqlalchemy import Column, String, Text, Date, Boolean, Numeric, DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class TaskUpdate(Base):
    __tablename__ = "task_updates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    report_date = Column(Date, nullable=False, server_default=func.current_date())

    morning_planned_work = Column(Text, nullable=True)
    morning_task_title = Column(Text, nullable=True)
    morning_status = Column(SAEnum("NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", name="task_status_enum", create_type=False), nullable=True)
    morning_est_hours = Column(Numeric(4, 2), nullable=True)
    morning_blockers = Column(Text, nullable=True)
    morning_submitted_at = Column(DateTime(timezone=True), nullable=True)

    evening_completed_work = Column(Text, nullable=True)
    evening_remaining_work = Column(Text, nullable=True)
    evening_hours_spent = Column(Numeric(4, 2), nullable=True)
    evening_challenges = Column(Text, nullable=True)
    evening_next_day_plan = Column(Text, nullable=True)
    evening_submitted_at = Column(DateTime(timezone=True), nullable=True)

    attachment_url = Column(String(500), nullable=True)
    attachment_name = Column(String(250), nullable=True)

    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", lazy="joined")
    project = relationship("Project", lazy="joined")
    task = relationship("Task", lazy="joined")
