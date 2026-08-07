from datetime import date, datetime
from pydantic import BaseModel


class CreateTaskRequest(BaseModel):
    project_id: str | None = None
    title: str
    description: str | None = None
    priority: str = "MEDIUM"
    assigned_to: str | None = None
    assigned_to_ids: list[str] = []
    due_date: date | None = None
    attachment_url: str | None = None
    attachment_name: str | None = None


class TaskResponse(BaseModel):
    id: str
    project_id: str | None = None
    project_name: str | None = None
    title: str
    description: str | None
    priority: str
    status: str
    assigned_to: str | None
    assigned_to_name: str | None = None
    created_by: str | None = None
    created_by_name: str | None = None
    due_date: date | None
    attachment_url: str | None = None
    attachment_name: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class UpdateTaskStatusRequest(BaseModel):
    status: str
    attachment_url: str | None = None
    attachment_name: str | None = None


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    assigned_to: str | None = None
    due_date: date | None = None
    attachment_url: str | None = None
    attachment_name: str | None = None

