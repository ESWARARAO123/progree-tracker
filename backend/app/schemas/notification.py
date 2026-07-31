from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    is_read: bool
    link: str | None
    created_at: datetime

    class Config:
        from_attributes = True
