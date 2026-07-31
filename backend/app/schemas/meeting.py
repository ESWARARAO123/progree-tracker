from datetime import date, datetime
from pydantic import BaseModel


class CreateMeetingRequest(BaseModel):
    title: str
    description: str | None = None
    date: date
    start_time: str
    assignee_ids: list[str] = []


class MeetingResponse(BaseModel):
    id: str
    title: str
    description: str | None
    date: date
    start_time: str
    created_by: str
    created_by_name: str | None = None
    assignee_ids: list[str] = []
    assignee_names: list[str] = []
    created_at: datetime

    class Config:
        from_attributes = True
