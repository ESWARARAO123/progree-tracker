from datetime import date, datetime
from pydantic import BaseModel


class CreateCompanyHolidayRequest(BaseModel):
    name: str
    description: str | None = None
    date: date


class CompanyHolidayResponse(BaseModel):
    id: str
    name: str
    description: str | None
    date: date
    created_by: str | None
    created_at: datetime

    class Config:
        from_attributes = True
