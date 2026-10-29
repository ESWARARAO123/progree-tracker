from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.role import Role
from app.models.leave_request import LeaveRequest
from app.models.notification import Notification
from app.models.project import Project
from app.models.project_assignment import ProjectAssignment
from app.schemas.leave import (
    LeaveRequestResponse,
    CreateLeaveRequest,
    ReviewLeaveRequest,
    LeaveBalanceResponse,
    UserLeaveUsageResponse,
    TodayLeaveResponse,
)
from app.api.v1.endpoints.auth import get_current_user, require_admin
from app.core.notify import get_admin_users, create_notification, send_leave_notification_email

router = APIRouter()

MONTHLY_LEAVE_LIMIT = 2

VALID_REQUEST_TYPES = ("LEAVE", "WFH", "WFBO")

REQUEST_TYPE_LABELS = {
    "LEAVE": "Leave",
    "WFH": "Work From Home",
    "WFBO": "Work From Bellandur Office",
}


def _month_range(ref: date) -> tuple[date, date]:
    month_start = ref.replace(day=1)
    if ref.month == 12:
        next_month = date(ref.year + 1, 1, 1)
    else:
        next_month = date(ref.year, ref.month + 1, 1)
    return month_start, next_month


async def _count_requests_in_month(
    db: AsyncSession, user_id, start: date, end: date, statuses: list[str], request_type: str
) -> int:
    result = await db.execute(
        select(func.count()).select_from(LeaveRequest).where(
            LeaveRequest.user_id == user_id,
            LeaveRequest.start_date >= start,
            LeaveRequest.start_date < end,
            LeaveRequest.status.in_(statuses),
            LeaveRequest.request_type == request_type,
        )
    )
    return result.scalar_one()


def _serialize(r: LeaveRequest) -> LeaveRequestResponse:
    return LeaveRequestResponse(
        id=str(r.id),
        user_id=str(r.user_id),
        user_name=r.user.full_name if r.user else None,
        request_type=r.request_type,
        start_date=r.start_date,
        end_date=r.end_date,
        reason=r.reason,
        status=r.status,
        reviewed_by=str(r.reviewed_by) if r.reviewed_by else None,
        admin_comment=r.admin_comment,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


@router.get("/admin/today", response_model=TodayLeaveResponse)
async def admin_today_view(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    today = date.today()

    # Who is on leave today (approved requests that cover today)
    on_leave_result = await db.execute(
        select(LeaveRequest)
        .where(
            LeaveRequest.status == "APPROVED",
            LeaveRequest.start_date <= today,
            LeaveRequest.end_date >= today,
        )
        .options(selectinload(LeaveRequest.user))
        .order_by(LeaveRequest.created_at.desc())
    )
    on_leave = [_serialize(r) for r in on_leave_result.scalars().all()]

    # Requests submitted today (pending ones need approval/rejection)
    requests_result = await db.execute(
        select(LeaveRequest)
        .where(LeaveRequest.created_at >= today)
        .options(selectinload(LeaveRequest.user))
        .order_by(LeaveRequest.created_at.desc())
    )
    requests_today = [_serialize(r) for r in requests_result.scalars().all()]

    return TodayLeaveResponse(
        on_leave_today=on_leave,
        requests_today=requests_today,
        date=today.isoformat(),
    )


@router.get("/admin/users-usage", response_model=list[UserLeaveUsageResponse])
async def admin_users_usage(
    month: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if month:
        try:
            ref = datetime.strptime(month, "%Y-%m").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    else:
        ref = date.today()

    start, end = _month_range(ref)
    statuses = ["PENDING", "APPROVED"]

    result = await db.execute(
        select(User)
        .join(Role, User.role_id == Role.id)
        .where(Role.name == "EMPLOYEE")
        .order_by(User.full_name.asc())
    )
    users = result.scalars().all()

    usage = []
    for u in users:
        used_leave = await _count_requests_in_month(db, u.id, start, end, statuses, "LEAVE")
        used_wfh = await _count_requests_in_month(db, u.id, start, end, statuses, "WFH")
        used_wfbo = await _count_requests_in_month(db, u.id, start, end, statuses, "WFBO")
        usage.append(UserLeaveUsageResponse(
            user_id=str(u.id),
            user_name=u.full_name,
            user_email=u.email,
            department=u.department,
            designation=u.designation,
            is_active=u.is_active,
            used_leave=used_leave,
            used_wfh=used_wfh,
            used_wfbo=used_wfbo,
            total=used_leave + used_wfh + used_wfbo,
        ))

    return usage


@router.get("/", response_model=list[LeaveRequestResponse])
async def list_leave_requests(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(LeaveRequest).options(
        selectinload(LeaveRequest.user),
        selectinload(LeaveRequest.reviewer),
    )

    if user.role.name != "ADMIN":
        query = query.where(LeaveRequest.user_id == user.id)

    query = query.order_by(LeaveRequest.created_at.desc())
    result = await db.execute(query)
    requests = result.scalars().all()

    return [
        LeaveRequestResponse(
            id=str(r.id),
            user_id=str(r.user_id),
            user_name=r.user.full_name if r.user else None,
            request_type=r.request_type,
            start_date=r.start_date,
            end_date=r.end_date,
            reason=r.reason,
            status=r.status,
            reviewed_by=str(r.reviewed_by) if r.reviewed_by else None,
            admin_comment=r.admin_comment,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in requests
    ]


@router.get("/summary", response_model=LeaveBalanceResponse)
async def leave_balance(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()
    start, end = _month_range(today)
    statuses = ["PENDING", "APPROVED"]
    used_leave = await _count_requests_in_month(db, user.id, start, end, statuses, "LEAVE")
    used_wfh = await _count_requests_in_month(db, user.id, start, end, statuses, "WFH")
    used_wfbo = await _count_requests_in_month(db, user.id, start, end, statuses, "WFBO")
    return LeaveBalanceResponse(
        total_allowed=30,
        used=used_leave,
        available=max(0, 30 - used_leave),
        month=today.strftime("%B %Y"),
        used_leave=used_leave,
        used_wfh=used_wfh,
        used_wfbo=used_wfbo,
    )


@router.post("/", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    body: CreateLeaveRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Apply leave request from user {user.id} ({user.full_name}): body={body}")
    
    if body.end_date < body.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date.")

    today_ist = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    if user.role.name != "ADMIN" and body.start_date < today_ist:
        raise HTTPException(
            status_code=400,
            detail="Leave requests must start from today or later. Past dates are not allowed.",
        )

    request_type = body.request_type or "LEAVE"
    if request_type not in ("LEAVE", "WFH"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request type '{request_type}'. Must be one of: LEAVE, WFH.",
        )

    import uuid as uuid_lib
    # Determine target user - admin or project owner can specify user_id
    target_user_id = user.id
    if body.user_id and body.user_id != str(user.id):
        # Check if current user is admin
        if user.role.name != "ADMIN":
            # Check if current user is project owner of a project the target user is assigned to
            from app.models.project import Project
            from app.models.project_assignment import ProjectAssignment
            try:
                target_uuid = uuid_lib.UUID(body.user_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid user_id format")
            result = await db.execute(
                select(Project).join(ProjectAssignment).where(
                    Project.owner_id == user.id,
                    ProjectAssignment.user_id == target_uuid
                )
            )
            project = result.scalar_one_or_none()
            if not project:
                raise HTTPException(
                    status_code=403,
                    detail="You can only submit leave requests for your own project team members."
                )
        try:
            target_user_id = uuid_lib.UUID(body.user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id format")
        # Verify target user exists
        target_user_result = await db.execute(select(User).where(User.id == target_user_id))
        target_user = target_user_result.scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")

    is_admin = user.role.name == "ADMIN"
    leave_status = "PENDING"
    reviewed_by = None
    admin_comment = None
    if is_admin:
        if body.status in ("APPROVED", "PENDING"):
            leave_status = body.status
        else:
            leave_status = "APPROVED"
        if leave_status == "APPROVED":
            reviewed_by = user.id
            admin_comment = "Added directly by Admin"

    leave = LeaveRequest(
        user_id=target_user_id,
        request_type=request_type,
        start_date=body.start_date,
        end_date=body.end_date,
        reason=body.reason,
        status=leave_status,
        reviewed_by=reviewed_by,
        admin_comment=admin_comment,
    )
    db.add(leave)
    await db.flush()

    # Get the actual user for notification
    leave_user_result = await db.execute(select(User).where(User.id == target_user_id))
    leave_user = leave_user_result.scalar_one()

    label = REQUEST_TYPE_LABELS.get(request_type, request_type)
    if is_admin and target_user_id != user.id:
        await create_notification(
            db, str(target_user_id),
            f"{label} Request Added",
            f"Admin {user.full_name} has added a {label} request ({leave_status}) for you from {body.start_date} to {body.end_date}.",
            link="/leave",
        )
    elif not is_admin:
        admins = await get_admin_users(db)
        for admin in admins:
            await create_notification(
                db, str(admin.id),
                f"New {label} Request",
                f"{leave_user.full_name} has submitted a {label} request from {body.start_date} to {body.end_date}.",
                link="/leave",
            )

    await db.commit()
    await db.refresh(leave)

    result = await db.execute(
        select(LeaveRequest).where(LeaveRequest.id == leave.id).options(
            selectinload(LeaveRequest.user),
            selectinload(LeaveRequest.reviewer),
        )
    )
    r = result.scalar_one()

    return LeaveRequestResponse(
        id=str(r.id),
        user_id=str(r.user_id),
        user_name=r.user.full_name if r.user else None,
        request_type=r.request_type,
        start_date=r.start_date,
        end_date=r.end_date,
        reason=r.reason,
        status=r.status,
        reviewed_by=str(r.reviewed_by) if r.reviewed_by else None,
        admin_comment=r.admin_comment,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_leave_request(
    leave_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(LeaveRequest).where(LeaveRequest.id == leave_id)
    )
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    await db.delete(leave)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{leave_id}/review", response_model=LeaveRequestResponse)
async def review_leave_request(
    leave_id: str,
    body: ReviewLeaveRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(
        select(LeaveRequest).where(LeaveRequest.id == leave_id).options(
            selectinload(LeaveRequest.user),
            selectinload(LeaveRequest.reviewer),
        )
    )
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave.status = body.status
    leave.reviewed_by = admin.id
    if body.admin_comment is not None:
        leave.admin_comment = body.admin_comment

    await db.flush()

    await create_notification(
        db, str(leave.user_id),
        f"{REQUEST_TYPE_LABELS.get(leave.request_type, leave.request_type)} Request {body.status}",
        f"Your {leave.request_type} request ({leave.start_date} to {leave.end_date}) has been {body.status} by {admin.full_name}.",
        link="/leave",
    )

    await db.commit()
    await db.refresh(leave)

    return LeaveRequestResponse(
        id=str(leave.id),
        user_id=str(leave.user_id),
        user_name=leave.user.full_name if leave.user else None,
        request_type=leave.request_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status=leave.status,
        reviewed_by=str(leave.reviewed_by) if leave.reviewed_by else None,
        admin_comment=leave.admin_comment,
        created_at=leave.created_at,
        updated_at=leave.updated_at,
    )
