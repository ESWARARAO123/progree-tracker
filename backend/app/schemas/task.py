from datetime import date, datetime
from pydantic import BaseModel


class CreateTaskRequest(BaseModel):
    project_id: str
    title: str
    description: str | None = None
    priority: str = "MEDIUM"
    assigned_to: str | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: str
    project_id: str
    project_name: str | None = None
    title: str
    description: str | None
    priority: str
    status: str
    assigned_to: str | None
    assigned_to_name: str | None = None
    due_date: date | None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class UpdateTaskStatusRequest(BaseModel):
    status: str
