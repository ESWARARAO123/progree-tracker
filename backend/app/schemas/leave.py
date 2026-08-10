from datetime import date, datetime
from pydantic import BaseModel


class CreateLeaveRequest(BaseModel):
    request_type: str = "LEAVE"
    start_date: date
    end_date: date
    reason: str


class LeaveBalanceResponse(BaseModel):
    total_allowed: int
    used: int
    available: int
    month: str
    used_leave: int = 0
    used_wfh: int = 0
    used_wfbo: int = 0


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


class UserLeaveUsageResponse(BaseModel):
    user_id: str
    user_name: str
    user_email: str | None = None
    department: str | None = None
    designation: str | None = None
    is_active: bool = True
    used_leave: int = 0
    used_wfh: int = 0
    used_wfbo: int = 0
    total: int = 0


class TodayLeaveResponse(BaseModel):
    on_leave_today: list[LeaveRequestResponse]
    requests_today: list[LeaveRequestResponse]
    date: str
