from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.project import Project
from app.models.project_assignment import ProjectAssignment
from app.models.project_request import ProjectRequest
from app.schemas.project_request import ProjectRequestResponse, ReviewProjectRequest
from app.api.v1.endpoints.auth import get_current_user, require_admin
from app.core.notify import create_notification

router = APIRouter()


@router.get("/", response_model=list[ProjectRequestResponse])
async def list_project_requests(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(ProjectRequest)
        .options(
            selectinload(ProjectRequest.user),
            selectinload(ProjectRequest.project),
            selectinload(ProjectRequest.reviewer),
        )
        .order_by(ProjectRequest.created_at.desc())
    )
    requests = result.scalars().all()

    return [
        ProjectRequestResponse(
            id=str(r.id),
            user_id=str(r.user_id),
            user_name=r.user.full_name if r.user else None,
            user_email=r.user.email if r.user else None,
            project_id=str(r.project_id),
            project_name=r.project.name if r.project else None,
            status=r.status,
            reviewed_by=str(r.reviewed_by) if r.reviewed_by else None,
            reviewer_name=r.reviewer.full_name if r.reviewer else None,
            admin_comment=r.admin_comment,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in requests
    ]


@router.patch("/{request_id}/review", response_model=ProjectRequestResponse)
async def review_project_request(
    request_id: str,
    body: ReviewProjectRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(ProjectRequest)
        .where(ProjectRequest.id == request_id)
        .options(
            selectinload(ProjectRequest.user),
            selectinload(ProjectRequest.project),
            selectinload(ProjectRequest.reviewer),
        )
    )
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Project request not found")

    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already reviewed")

    req.status = body.status
    req.reviewed_by = admin.id
    if body.admin_comment is not None:
        req.admin_comment = body.admin_comment

    if body.status == "APPROVED":
        assign_exists = await db.execute(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == req.project_id,
                ProjectAssignment.user_id == req.user_id,
            )
        )
        if not assign_exists.scalar_one_or_none():
            db.add(ProjectAssignment(project_id=req.project_id, user_id=req.user_id))

    await db.flush()

    await create_notification(
        db, str(req.user_id),
        f"Project Request {body.status}",
        f"Your request to work on '{req.project.name}' has been {body.status}.",
        link="/projects",
    )

    await db.commit()
    await db.refresh(req)

    return ProjectRequestResponse(
        id=str(req.id),
        user_id=str(req.user_id),
        user_name=req.user.full_name if req.user else None,
        user_email=req.user.email if req.user else None,
        project_id=str(req.project_id),
        project_name=req.project.name if req.project else None,
        status=req.status,
        reviewed_by=str(req.reviewed_by) if req.reviewed_by else None,
        reviewer_name=req.reviewer.full_name if req.reviewer else None,
        admin_comment=req.admin_comment,
        created_at=req.created_at,
        updated_at=req.updated_at,
    )
