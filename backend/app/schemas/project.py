from datetime import date, datetime
from pydantic import BaseModel


class AssignedUser(BaseModel):
    id: str
    full_name: str
    email: str


class OwnerInfo(BaseModel):
    id: str
    full_name: str
    email: str


class CreateProjectRequest(BaseModel):
    name: str
    description: str | None = None
    start_date: date
    end_date: date | None = None
    priority: str = "MEDIUM"
    status: str = "PLANNING"
    owner_id: str | None = None
    assigned_user_ids: list[str] = []


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    priority: str | None = None
    status: str | None = None
    progress_percentage: float | None = None
    owner_id: str | None = None
    assigned_user_ids: list[str] | None = None
    owner_status: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None
    start_date: date
    end_date: date | None
    priority: str
    status: str
    progress_percentage: float
    created_by: str | None
    owner: OwnerInfo | None = None
    assigned_users: list[AssignedUser] = []
    created_at: datetime | None = None
    owner_status: str | None = None
    owner_status_updated_at: datetime | None = None

    class Config:
        from_attributes = True
