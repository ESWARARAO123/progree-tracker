from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    user_id: str | None
    user_name: str | None = None
    action_type: str
    ip_address: str | None
    details: dict | None
    created_at: datetime

    class Config:
        from_attributes = True
