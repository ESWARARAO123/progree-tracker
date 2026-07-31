import uuid

from sqlalchemy import Column, String, Text, Date, DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(SAEnum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="priority_enum", create_type=False), default="MEDIUM")
    status = Column(SAEnum("NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", name="task_status_enum", create_type=False), default="NOT_STARTED")
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", lazy="joined")
    assignee = relationship("User", lazy="joined")
