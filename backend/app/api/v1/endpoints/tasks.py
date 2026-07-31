from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskResponse, CreateTaskRequest, UpdateTaskStatusRequest, UpdateTaskRequest
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    project_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Task).options(
        selectinload(Task.project), selectinload(Task.assignee)
    )

    if project_id:
        query = query.where(Task.project_id == UUID(project_id))

    if user.role.name != "ADMIN":
        query = query.where(Task.assigned_to == user.id)

    result = await db.execute(query)
    tasks = result.scalars().all()

    return [
        TaskResponse(
            id=str(t.id),
            project_id=str(t.project_id),
            project_name=t.project.name if t.project else None,
            title=t.title,
            description=t.description,
            priority=t.priority,
            status=t.status,
            assigned_to=str(t.assigned_to) if t.assigned_to else None,
            assigned_to_name=t.assignee.full_name if t.assignee else None,
            due_date=t.due_date,
            created_at=t.created_at,
        )
        for t in tasks
    ]


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: CreateTaskRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    target_user_ids = body.assigned_to_ids if body.assigned_to_ids else ([body.assigned_to] if body.assigned_to else [])
    if not target_user_ids:
        target_user_ids = [str(user.id)]

    created_tasks = []
    for uid in target_user_ids:
        task = Task(
            project_id=UUID(body.project_id),
            title=body.title,
            description=body.description,
            priority=body.priority,
            assigned_to=UUID(uid),
            due_date=body.due_date,
        )
        db.add(task)
        created_tasks.append(task)

    await db.commit()

    first_task = created_tasks[0]
    result = await db.execute(
        select(Task).where(Task.id == first_task.id).options(
            selectinload(Task.project), selectinload(Task.assignee)
        )
    )
    task = result.scalar_one()

    return TaskResponse(
        id=str(task.id),
        project_id=str(task.project_id),
        project_name=task.project.name if task.project else None,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        assigned_to=str(task.assigned_to) if task.assigned_to else None,
        assigned_to_name=task.assignee.full_name if task.assignee else None,
        due_date=task.due_date,
        created_at=task.created_at,
    )


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    body: UpdateTaskStatusRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(Task.id == UUID(task_id)).options(
            selectinload(Task.project), selectinload(Task.assignee)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if user.role.name != "ADMIN" and task.assigned_to != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    task.status = body.status
    await db.commit()
    await db.refresh(task)

    return TaskResponse(
        id=str(task.id),
        project_id=str(task.project_id),
        project_name=task.project.name if task.project else None,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        assigned_to=str(task.assigned_to) if task.assigned_to else None,
        assigned_to_name=task.assignee.full_name if task.assignee else None,
        due_date=task.due_date,
        created_at=task.created_at,
    )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    body: UpdateTaskRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(Task.id == UUID(task_id)).options(
            selectinload(Task.project), selectinload(Task.assignee)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if user.role.name != "ADMIN" and task.assigned_to != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if body.title is not None:
        task.title = body.title
    if body.description is not None:
        task.description = body.description
    if body.priority is not None:
        task.priority = body.priority
    if body.status is not None:
        task.status = body.status
    if body.due_date is not None:
        task.due_date = body.due_date
    if body.assigned_to is not None:
        task.assigned_to = UUID(body.assigned_to) if body.assigned_to else None

    await db.commit()
    await db.refresh(task)

    result = await db.execute(
        select(Task).where(Task.id == task.id).options(
            selectinload(Task.project), selectinload(Task.assignee)
        )
    )
    task = result.scalar_one()

    return TaskResponse(
        id=str(task.id),
        project_id=str(task.project_id),
        project_name=task.project.name if task.project else None,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        assigned_to=str(task.assigned_to) if task.assigned_to else None,
        assigned_to_name=task.assignee.full_name if task.assignee else None,
        due_date=task.due_date,
        created_at=task.created_at,
    )
