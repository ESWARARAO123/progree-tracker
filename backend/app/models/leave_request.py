import uuid

from sqlalchemy import Column, String, Text, Date, DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_type = Column(SAEnum("LEAVE", "WFH", "WFBO", name="request_type_enum", create_type=False), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(SAEnum("PENDING", "APPROVED", "REJECTED", "CANCELLED", name="request_status_enum", create_type=False), default="PENDING")
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id], lazy="joined")
    reviewer = relationship("User", foreign_keys=[reviewed_by], lazy="joined")
