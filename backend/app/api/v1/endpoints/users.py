from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.role import Role
from app.models.project import Project
from app.models.project_assignment import ProjectAssignment
from app.models.leave_request import LeaveRequest
from app.models.project_request import ProjectRequest
from app.models.task import Task
from app.models.task_update import TaskUpdate
from app.models.notification import Notification
from app.models.meeting import Meeting, MeetingAssignee
from app.schemas.user import UserResponse, CreateUserRequest, UpdateUserRequest
from app.api.v1.endpoints.auth import get_current_user, require_admin

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return [
        UserResponse(
            id=str(u.id),
            full_name=u.full_name,
            email=u.email,
            role=u.role.name,
            department=u.department,
            designation=u.designation,
            is_active=u.is_active,
            current_project_id=str(u.current_project_id) if u.current_project_id else None,
        )
        for u in users
    ]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    role_result = await db.execute(select(Role).where(Role.name == body.role.upper()))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {body.role}. Must be ADMIN or EMPLOYEE",
        )

    user = User(
        role_id=role.id,
        full_name=body.full_name,
        email=body.email,
        password_hash=get_password_hash(body.password),
        department=body.department,
        designation=body.designation,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        role=user.role.name,
        department=user.department,
        designation=user.designation,
        is_active=user.is_active,
        current_project_id=str(user.current_project_id) if user.current_project_id else None,
    )


@router.patch("/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_status(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        role=user.role.name,
        department=user.department,
        designation=user.designation,
        is_active=user.is_active,
        current_project_id=str(user.current_project_id) if user.current_project_id else None,
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.email and body.email != user.email:
        existing = await db.execute(select(User).where(User.email == body.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered")
        user.email = body.email

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.password and body.password.strip():
        user.password_hash = get_password_hash(body.password)
    if body.department is not None:
        user.department = body.department
    if body.designation is not None:
        user.designation = body.designation
    if body.is_active is not None:
        user.is_active = body.is_active

    if body.role:
        role_result = await db.execute(select(Role).where(Role.name == body.role.upper()))
        role = role_result.scalar_one_or_none()
        if not role:
            raise HTTPException(status_code=400, detail=f"Invalid role: {body.role}")
        user.role_id = role.id

    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        role=user.role.name,
        department=user.department,
        designation=user.designation,
        is_active=user.is_active,
        current_project_id=str(user.current_project_id) if user.current_project_id else None,
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if str(admin.id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Clear / delete references where user is referenced
    await db.execute(sa_update(Project).where(Project.created_by == user.id).values(created_by=None))
    await db.execute(sa_update(LeaveRequest).where(LeaveRequest.reviewed_by == user.id).values(reviewed_by=None))
    await db.execute(sa_update(ProjectRequest).where(ProjectRequest.reviewed_by == user.id).values(reviewed_by=None))
    await db.execute(sa_update(Meeting).where(Meeting.created_by == user.id).values(created_by=None))
    await db.execute(sa_update(Task).where(Task.assigned_to == user.id).values(assigned_to=None))

    await db.execute(delete(TaskUpdate).where(TaskUpdate.user_id == user.id))
    await db.execute(delete(LeaveRequest).where(LeaveRequest.user_id == user.id))
    await db.execute(delete(ProjectRequest).where(ProjectRequest.user_id == user.id))
    await db.execute(delete(Notification).where(Notification.user_id == user.id))
    await db.execute(delete(MeetingAssignee).where(MeetingAssignee.user_id == user.id))
    await db.execute(delete(ProjectAssignment).where(ProjectAssignment.user_id == user.id))

    await db.delete(user)
    await db.commit()
    return None
