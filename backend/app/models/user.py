import uuid

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    current_project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    preferences = Column(JSONB, nullable=True)

    role = relationship("Role", lazy="joined")
    current_project = relationship("Project", foreign_keys=[current_project_id], lazy="joined")
