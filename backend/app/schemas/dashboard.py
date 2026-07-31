from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_users: int = 0
    active_users: int = 0
    today_morning_updates: int = 0
    today_evening_updates: int = 0
    pending_leave_requests: int = 0
    total_projects: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
