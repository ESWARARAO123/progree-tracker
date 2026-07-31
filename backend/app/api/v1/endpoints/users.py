from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserResponse, CreateUserRequest
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
