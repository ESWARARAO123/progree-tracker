from datetime import date as date_type, datetime
from pydantic import BaseModel


class CreateMeetingRequest(BaseModel):
    title: str
    description: str | None = None
    date: date_type
    start_time: str
    end_time: str | None = None
    meeting_link: str | None = None
    assignee_ids: list[str] = []


class UpdateMeetingRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    date: date_type | None = None
    start_time: str | None = None
    end_time: str | None = None
    meeting_link: str | None = None
    assignee_ids: list[str] | None = None


class MeetingResponse(BaseModel):
    id: str
    title: str
    description: str | None
    date: date_type
    start_time: str
    end_time: str | None = None
    meeting_link: str | None = None
    created_by: str
    created_by_name: str | None = None
    assignee_ids: list[str] = []
    assignee_names: list[str] = []
    created_at: datetime

    class Config:
        from_attributes = True
