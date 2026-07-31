from datetime import date, datetime
from pydantic import BaseModel


class MorningUpdateRequest(BaseModel):
    project_id: str
    task_id: str | None = None
    morning_task_title: str | None = None
    planned_work: str
    est_hours: float
    blockers: str | None = None


class EveningUpdateRequest(BaseModel):
    completed_work: str
    remaining_work: str
    hours_spent: float
    challenges: str | None = None
    next_day_plan: str


class TaskUpdateResponse(BaseModel):
    id: str
    user_id: str
    user_name: str | None = None
    project_id: str | None
    task_id: str | None
    report_date: date
    morning_planned_work: str | None
    morning_task_title: str | None
    morning_status: str | None
    morning_est_hours: float | None
    morning_blockers: str | None
    morning_submitted_at: datetime | None
    evening_completed_work: str | None
    evening_remaining_work: str | None
    evening_hours_spent: float | None
    evening_challenges: str | None
    evening_next_day_plan: str | None
    evening_submitted_at: datetime | None
    is_locked: bool

    class Config:
        from_attributes = True
