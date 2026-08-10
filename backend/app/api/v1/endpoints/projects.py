from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.project import Project
from app.models.project_assignment import ProjectAssignment
from app.models.project_request import ProjectRequest
from app.models.task import Task
from app.schemas.project import ProjectResponse, CreateProjectRequest, UpdateProjectRequest, AssignedUser, OwnerInfo
from app.api.v1.endpoints.auth import get_current_user, require_admin
from app.core.notify import get_admin_users, create_notification

router = APIRouter()

EDIT_WINDOW = timedelta(days=7)


def _age_is_within(dt: datetime | None, window: timedelta) -> bool:
    if dt is None:
        return False
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - dt <= window


def _serialize_project(p: Project, assigned_map: dict[str, list[AssignedUser]]) -> ProjectResponse:
    return ProjectResponse(
        id=str(p.id),
        name=p.name,
        description=p.description,
        start_date=p.start_date,
        end_date=p.end_date,
        priority=p.priority,
        status=p.status,
        progress_percentage=float(p.progress_percentage) if p.progress_percentage else 0.0,
        created_by=str(p.created_by) if p.created_by else None,
        owner=OwnerInfo(id=str(p.owner.id), full_name=p.owner.full_name, email=p.owner.email) if p.owner else None,
        assigned_users=assigned_map.get(str(p.id), []),
        created_at=p.created_at,
    )


async def _build_assigned_map(db: AsyncSession, project_ids: list[UUID]) -> dict[str, list[AssignedUser]]:
    assigned_map: dict[str, list[AssignedUser]] = {}
    if not project_ids:
        return assigned_map
    result = await db.execute(
        select(ProjectAssignment)
        .where(ProjectAssignment.project_id.in_(project_ids))
        .options(selectinload(ProjectAssignment.user))
    )
    for a in result.scalars().all():
        pid = str(a.project_id)
        if pid not in assigned_map:
            assigned_map[pid] = []
        if a.user:
            assigned_map[pid].append(AssignedUser(
                id=str(a.user.id),
                full_name=a.user.full_name,
                email=a.user.email,
            ))
    return assigned_map


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Project).options(selectinload(Project.owner), selectinload(Project.creator))
    result = await db.execute(query)
    projects = result.scalars().all()

    assigned_map = await _build_assigned_map(db, [p.id for p in projects])
    return [_serialize_project(p, assigned_map) for p in projects]


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: CreateProjectRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    owner_id_val = UUID(body.owner_id) if body.owner_id else None
    project = Project(
        name=body.name,
        description=body.description,
        start_date=body.start_date,
        end_date=body.end_date,
        priority=body.priority,
        status=body.status,
        owner_id=owner_id_val,
        created_by=admin.id,
    )
    db.add(project)
    await db.flush()

    for uid in body.assigned_user_ids:
        assignment = ProjectAssignment(project_id=project.id, user_id=UUID(uid))
        db.add(assignment)

    await db.commit()
    await db.refresh(project)

    assigned_map = await _build_assigned_map(db, [project.id])
    return _serialize_project(project, assigned_map)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: UpdateProjectRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == UUID(project_id)).options(selectinload(Project.owner))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_admin = user.role.name == "ADMIN"
    if not is_admin:
        if project.owner_id != user.id:
            raise HTTPException(
                status_code=403,
                detail="Only the project owner or an admin can update this project.",
            )
        if not _age_is_within(project.created_at, EDIT_WINDOW):
            raise HTTPException(
                status_code=403,
                detail="Projects can only be updated by the owner within 7 days of creation. Contact an admin to edit older projects.",
            )

    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
    if body.start_date is not None:
        project.start_date = body.start_date
    if body.end_date is not None:
        project.end_date = body.end_date
    if body.priority is not None:
        project.priority = body.priority
    if body.status is not None:
        project.status = body.status
    if body.progress_percentage is not None:
        project.progress_percentage = body.progress_percentage
    if is_admin and body.owner_id is not None:
        project.owner_id = UUID(body.owner_id) if body.owner_id else None

    if is_admin and body.assigned_user_ids is not None:
        old_assignments = await db.execute(
            select(ProjectAssignment).where(ProjectAssignment.project_id == project.id)
        )
        for a in old_assignments.scalars().all():
            await db.delete(a)
        for uid in body.assigned_user_ids:
            db.add(ProjectAssignment(project_id=project.id, user_id=UUID(uid)))

    await db.commit()
    await db.refresh(project)

    assigned_map = await _build_assigned_map(db, [project.id])
    return _serialize_project(project, assigned_map)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Clear current_project_id on users referencing this project
    await db.execute(
        sa_update(User)
        .where(User.current_project_id == project.id)
        .values(current_project_id=None)
    )
    # Delete tasks referencing this project
    await db.execute(delete(Task).where(Task.project_id == project.id))
    # Delete project requests for this project
    await db.execute(delete(ProjectRequest).where(ProjectRequest.project_id == project.id))
    # Delete project assignments
    await db.execute(delete(ProjectAssignment).where(ProjectAssignment.project_id == project.id))

    await db.delete(project)
    await db.commit()


@router.post("/{project_id}/select", response_model=dict)
async def select_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    assign_check = await db.execute(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project.id,
            ProjectAssignment.user_id == user.id,
        )
    )
    is_owner = project.owner_id == user.id
    if not is_owner and not assign_check.scalar_one_or_none():
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this project. Request access from an admin to be added.",
        )

    user.current_project_id = project.id
    await db.commit()
    return {"status": "ok", "project_id": str(project.id)}


@router.post("/{project_id}/request", response_model=dict, status_code=status.HTTP_201_CREATED)
async def request_project_access(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    body = await db.execute(select(Project).where(Project.id == project_id))
    project = body.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    assign_check = await db.execute(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project.id,
            ProjectAssignment.user_id == user.id,
        )
    )
    if project.owner_id == user.id or assign_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have access to this project")

    existing = await db.execute(
        select(ProjectRequest).where(
            ProjectRequest.project_id == project.id,
            ProjectRequest.user_id == user.id,
            ProjectRequest.status == "PENDING",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Request already pending for this project")

    req = ProjectRequest(user_id=user.id, project_id=project.id)
    db.add(req)
    await db.flush()

    admins = await get_admin_users(db)
    for admin in admins:
        await create_notification(
            db, str(admin.id),
            "Project Access Request",
            f"{user.full_name} requested to work on the project '{project.name}'.",
            link="/projects",
        )

    await db.commit()
    return {"status": "ok", "request_id": str(req.id)}


@router.post("/request-to-join", response_model=dict, status_code=status.HTTP_201_CREATED)
async def request_to_join_project(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    admins = await get_admin_users(db)
    for admin in admins:
        await create_notification(
            db, str(admin.id),
            "Project Assignment Request",
            f"{user.full_name} ({user.email}) has no project assigned and requested to be added to a project.",
            link="/projects",
        )

    await db.commit()
    return {"status": "ok", "message": "Request sent to admins"}


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id).options(selectinload(Project.owner), selectinload(Project.creator))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    assigned_map = await _build_assigned_map(db, [project.id])
    return _serialize_project(project, assigned_map)
