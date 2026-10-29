from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.task import Task
from app.models.project import Project
from app.models.project_assignment import ProjectAssignment
from app.models.project_document import ProjectDocument
from app.schemas.task import TaskResponse, CreateTaskRequest, UpdateTaskStatusRequest, UpdateTaskRequest
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

EDIT_WINDOW = timedelta(days=7)


def _register_attachment(
    db: AsyncSession,
    project_id: UUID | None,
    user_id: UUID,
    attachment_url: str | None,
    attachment_name: str | None,
    source: str = "task",
) -> None:
    if not project_id or not attachment_url:
        return
    try:
        db.add(ProjectDocument(
            project_id=project_id,
            user_id=user_id,
            file_url=attachment_url,
            file_name=attachment_name or attachment_url.split("/")[-1],
            source=source,
        ))
    except Exception:
        pass


def _age_is_within(dt: datetime | None, window: timedelta) -> bool:
    if dt is None:
        return False
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - dt <= window


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    project_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Task).options(
        selectinload(Task.project), selectinload(Task.assignee), selectinload(Task.creator)
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
            project_id=str(t.project_id) if t.project_id else None,
            project_name=t.project.name if t.project else "Others",
            title=t.title,
            description=t.description,
            priority=t.priority,
            status=t.status,
            assigned_to=str(t.assigned_to) if t.assigned_to else None,
            assigned_to_name=t.assignee.full_name if t.assignee else None,
            created_by=str(t.created_by) if t.created_by else None,
            created_by_name=t.creator.full_name if t.creator else None,
            due_date=t.due_date,
            attachment_url=t.attachment_url,
            attachment_name=t.attachment_name,
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

    project_uuid = None
    if body.project_id and body.project_id.strip():
        try:
            project_uuid = UUID(body.project_id.strip())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project id")

    project = None
    if project_uuid:
        project_result = await db.execute(select(Project).where(Project.id == project_uuid))
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    target_uuids = {UUID(uid) for uid in target_user_ids}
    existing_result = await db.execute(select(User.id).where(User.id.in_(target_uuids)))
    existing_ids = {row[0] for row in existing_result.all()}
    missing = target_uuids - existing_ids
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid assignee user(s): {', '.join(str(m) for m in missing)}",
        )

    if user.role.name != "ADMIN":
        if project is None:
            if target_uuids != {user.id}:
                raise HTTPException(
                    status_code=403,
                    detail="You can only add tasks assigned to yourself.",
                )
        else:
            member_result = await db.execute(
                select(ProjectAssignment.user_id).where(ProjectAssignment.project_id == project.id)
            )
            member_ids = {row[0] for row in member_result.all()}
            if project.owner_id:
                member_ids.add(project.owner_id)

            if user.id == project.owner_id:
                if not target_uuids.issubset(member_ids):
                    raise HTTPException(
                        status_code=403,
                        detail="Project owners can only assign tasks to members of their project.",
                    )
            elif target_uuids != {user.id}:
                raise HTTPException(
                    status_code=403,
                    detail="You can only add tasks assigned to yourself.",
                )

    created_tasks = []
    for uid in target_user_ids:
        task = Task(
            project_id=project_uuid,
            title=body.title,
            description=body.description,
            priority=body.priority,
            assigned_to=UUID(uid),
            created_by=user.id,
            due_date=body.due_date,
            attachment_url=body.attachment_url,
            attachment_name=body.attachment_name,
        )
        db.add(task)
        created_tasks.append(task)

    if project_uuid and body.attachment_url:
        for uid in target_user_ids:
            _register_attachment(db, project_uuid, UUID(uid), body.attachment_url, body.attachment_name, source="task")

    await db.commit()

    first_task = created_tasks[0]
    result = await db.execute(
        select(Task).where(Task.id == first_task.id).options(
            selectinload(Task.project), selectinload(Task.assignee), selectinload(Task.creator)
        )
    )
    task = result.scalar_one()

    return TaskResponse(
        id=str(task.id),
        project_id=str(task.project_id) if task.project_id else None,
        project_name=task.project.name if task.project else "Others",
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        assigned_to=str(task.assigned_to) if task.assigned_to else None,
        assigned_to_name=task.assignee.full_name if task.assignee else None,
        created_by=str(task.created_by) if task.created_by else None,
        created_by_name=task.creator.full_name if task.creator else None,
        due_date=task.due_date,
        attachment_url=task.attachment_url,
        attachment_name=task.attachment_name,
        created_at=task.created_at,
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(Task.id == UUID(task_id)).options(
            selectinload(Task.project), selectinload(Task.assignee), selectinload(Task.creator)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    is_admin = user.role.name == "ADMIN"
    is_project_owner = task.project and task.project.owner_id == user.id
    is_assignee = task.assigned_to == user.id

    if not (is_admin or is_project_owner or is_assignee):
        raise HTTPException(status_code=403, detail="Only the assigned user, project owner, or an admin can delete this task.")

    if is_assignee and not is_admin and not is_project_owner:
        if not _age_is_within(task.created_at, EDIT_WINDOW):
            raise HTTPException(status_code=403, detail="Tasks can only be deleted by the assignee within 7 days of creation. Contact an admin to delete older tasks.")

    await db.delete(task)
    await db.commit()
    return None


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: str,
    body: UpdateTaskStatusRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Task).where(Task.id == UUID(task_id)).options(
            selectinload(Task.project), selectinload(Task.assignee), selectinload(Task.creator)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    is_admin = user.role.name == "ADMIN"
    is_project_owner = task.project and task.project.owner_id == user.id
    is_assignee = task.assigned_to == user.id

    if not (is_admin or is_project_owner or is_assignee):
        raise HTTPException(status_code=403, detail="Only the assigned user, project owner, or an admin can update this task.")

    task.status = body.status
    if body.attachment_url is not None:
        task.attachment_url = body.attachment_url
    if body.attachment_name is not None:
        task.attachment_name = body.attachment_name

    if body.attachment_url:
        _register_attachment(db, task.project_id, task.assigned_to, body.attachment_url, body.attachment_name, source="task")

    await db.commit()
    await db.refresh(task)

    return TaskResponse(
        id=str(task.id),
        project_id=str(task.project_id) if task.project_id else None,
        project_name=task.project.name if task.project else "Others",
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        assigned_to=str(task.assigned_to) if task.assigned_to else None,
        assigned_to_name=task.assignee.full_name if task.assignee else None,
        created_by=str(task.created_by) if task.created_by else None,
        created_by_name=task.creator.full_name if task.creator else None,
        due_date=task.due_date,
        attachment_url=task.attachment_url,
        attachment_name=task.attachment_name,
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
            selectinload(Task.project), selectinload(Task.assignee), selectinload(Task.creator)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    is_admin = user.role.name == "ADMIN"
    is_project_owner = task.project and task.project.owner_id == user.id
    is_assignee = task.assigned_to == user.id

    if not (is_admin or is_project_owner or is_assignee):
        raise HTTPException(
            status_code=403,
            detail="Only the assigned user, project owner, or an admin can edit this task.",
        )

    if is_assignee and not is_admin and not is_project_owner:
        if not _age_is_within(task.created_at, EDIT_WINDOW):
            raise HTTPException(
                status_code=403,
                detail="Tasks can only be updated by the assignee within 7 days of creation. Contact an admin to edit older tasks.",
            )

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
    if is_admin and body.assigned_to is not None:
        task.assigned_to = UUID(body.assigned_to) if body.assigned_to else None
    if body.attachment_url is not None:
        task.attachment_url = body.attachment_url
    if body.attachment_name is not None:
        task.attachment_name = body.attachment_name

    if body.attachment_url:
        _register_attachment(db, task.project_id, task.assigned_to or user.id, body.attachment_url, body.attachment_name, source="task")

    await db.commit()
    await db.refresh(task)

    result = await db.execute(
        select(Task).where(Task.id == task.id).options(
            selectinload(Task.project), selectinload(Task.assignee), selectinload(Task.creator)
        )
    )
    task = result.scalar_one()

    return TaskResponse(
        id=str(task.id),
        project_id=str(task.project_id) if task.project_id else None,
        project_name=task.project.name if task.project else "Others",
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        assigned_to=str(task.assigned_to) if task.assigned_to else None,
        assigned_to_name=task.assignee.full_name if task.assignee else None,
        created_by=str(task.created_by) if task.created_by else None,
        created_by_name=task.creator.full_name if task.creator else None,
        due_date=task.due_date,
        attachment_url=task.attachment_url,
        attachment_name=task.attachment_name,
        created_at=task.created_at,
    )

