import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Date, Numeric, DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    priority = Column(SAEnum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="priority_enum", create_type=False), default="MEDIUM")
    status = Column(SAEnum("PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "ARCHIVED", name="project_status_enum", create_type=False), default="PLANNING")
    progress_percentage = Column(Numeric(5, 2), default=0.00)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    owner_status = Column(Text, nullable=True)
    owner_status_updated_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", foreign_keys=[owner_id], lazy="joined")
    creator = relationship("User", foreign_keys=[created_by], lazy="joined")
