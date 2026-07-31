from datetime import datetime
from pydantic import BaseModel


class ProjectRequestResponse(BaseModel):
    id: str
    user_id: str
    user_name: str | None
    user_email: str | None
    project_id: str
    project_name: str | None
    status: str
    reviewed_by: str | None = None
    reviewer_name: str | None = None
    admin_comment: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ReviewProjectRequest(BaseModel):
    status: str
    admin_comment: str | None = None
