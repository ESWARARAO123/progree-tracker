from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, field_validator


class CreateCompanyHolidayRequest(BaseModel):
    name: str
    description: str | None = None
    date: date


class CompanyHolidayResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    date: date
    created_by: str | None = None
    created_at: datetime

    @field_validator("id", "created_by", mode="before")
    @classmethod
    def stringify_uuid(cls, v: Any) -> str | None:
        if v is None:
            return None
        return str(v)

    class Config:
        from_attributes = True

