from datetime import datetime
from pydantic import BaseModel


class ProjectDocumentResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    user_name: str | None = None
    file_url: str
    file_name: str
    content_type: str | None = None
    size: int | None = None
    source: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
