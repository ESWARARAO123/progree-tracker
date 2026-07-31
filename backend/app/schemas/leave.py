from datetime import date, datetime
from pydantic import BaseModel


class CreateLeaveRequest(BaseModel):
    start_date: date
    end_date: date
    reason: str


class LeaveBalanceResponse(BaseModel):
    total_allowed: int
    used: int
    available: int
    month: str


class ReviewLeaveRequest(BaseModel):
    status: str
    admin_comment: str | None = None


class LeaveRequestResponse(BaseModel):
    id: str
    user_id: str
    user_name: str | None = None
    request_type: str
    start_date: date
    end_date: date
    reason: str
    status: str
    reviewed_by: str | None
    admin_comment: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
