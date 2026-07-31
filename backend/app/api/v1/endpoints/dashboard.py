from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.task_update import TaskUpdate
from app.models.project_assignment import ProjectAssignment
from app.schemas.dashboard import DashboardStats
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    is_admin = user.role.name == "ADMIN"
    today = date.today()

    if is_admin:
        total_users = (await db.execute(select(sa_func.count(User.id)))).scalar() or 0
        active_users = (await db.execute(
            select(sa_func.count(User.id)).where(User.is_active == True)
        )).scalar() or 0
        total_projects = (await db.execute(select(sa_func.count(Project.id)))).scalar() or 0
    else:
        total_users = 1
        active_users = 1
        total_projects = (await db.execute(
            select(sa_func.count(Project.id)).where(
                Project.id.in_(
                    select(ProjectAssignment.project_id).where(
                        ProjectAssignment.user_id == user.id
                    )
                )
            )
        )).scalar() or 0

    morning_query = select(sa_func.count(TaskUpdate.id)).where(
        TaskUpdate.report_date == today,
        TaskUpdate.morning_submitted_at.isnot(None),
    )
    evening_query = select(sa_func.count(TaskUpdate.id)).where(
        TaskUpdate.report_date == today,
        TaskUpdate.evening_submitted_at.isnot(None),
    )
    total_tasks_query = select(sa_func.count(Task.id))
    completed_tasks_query = select(sa_func.count(Task.id)).where(
        Task.status == "COMPLETED"
    )

    if not is_admin:
        morning_query = morning_query.where(TaskUpdate.user_id == user.id)
        evening_query = evening_query.where(TaskUpdate.user_id == user.id)
        total_tasks_query = total_tasks_query.where(Task.assigned_to == user.id)
        completed_tasks_query = completed_tasks_query.where(
            Task.assigned_to == user.id, Task.status == "COMPLETED"
        )

    today_morning = (await db.execute(morning_query)).scalar() or 0
    today_evening = (await db.execute(evening_query)).scalar() or 0

    pending_leave = 0
    if is_admin:
        from app.models.leave_request import LeaveRequest
        pending_leave = (await db.execute(
            select(sa_func.count(LeaveRequest.id)).where(
                LeaveRequest.status == "PENDING"
            )
        )).scalar() or 0

    total_tasks = (await db.execute(total_tasks_query)).scalar() or 0
    completed_tasks = (await db.execute(completed_tasks_query)).scalar() or 0

    return DashboardStats(
        total_users=total_users,
        active_users=active_users,
        today_morning_updates=today_morning,
        today_evening_updates=today_evening,
        pending_leave_requests=pending_leave,
        total_projects=total_projects,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
    )
