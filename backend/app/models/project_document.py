import uuid

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class ProjectDocument(Base):
    __tablename__ = "project_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(250), nullable=False)
    content_type = Column(String(120), nullable=True)
    size = Column(Integer, nullable=True)
    source = Column(String(50), nullable=True, default="direct")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", lazy="joined")
    project = relationship("Project", lazy="joined")
