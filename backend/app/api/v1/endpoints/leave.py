from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.leave_request import LeaveRequest
from app.models.notification import Notification
from app.schemas.leave import LeaveRequestResponse, CreateLeaveRequest, ReviewLeaveRequest, LeaveBalanceResponse
from app.api.v1.endpoints.auth import get_current_user, require_admin
from app.core.notify import get_admin_users, create_notification, send_leave_notification_email

router = APIRouter()

MONTHLY_LEAVE_LIMIT = 2


def _month_range(ref: date) -> tuple[date, date]:
    month_start = ref.replace(day=1)
    if ref.month == 12:
        next_month = date(ref.year + 1, 1, 1)
    else:
        next_month = date(ref.year, ref.month + 1, 1)
    return month_start, next_month


async def _count_leaves_in_month(
    db: AsyncSession, user_id, start: date, end: date, statuses: list[str]
) -> int:
    result = await db.execute(
        select(func.count()).select_from(LeaveRequest).where(
            LeaveRequest.user_id == user_id,
            LeaveRequest.start_date >= start,
            LeaveRequest.start_date < end,
            LeaveRequest.status.in_(statuses),
        )
    )
    return result.scalar_one()


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
    used = await _count_leaves_in_month(
        db, user.id, start, end, statuses=["PENDING", "APPROVED"]
    )
    return LeaveBalanceResponse(
        total_allowed=MONTHLY_LEAVE_LIMIT,
        used=used,
        available=max(0, MONTHLY_LEAVE_LIMIT - used),
        month=today.strftime("%B %Y"),
    )


@router.post("/", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    body: CreateLeaveRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.end_date < body.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date.")

    start, end = _month_range(body.start_date)
    used = await _count_leaves_in_month(
        db, user.id, start, end, statuses=["PENDING", "APPROVED"]
    )
    if used >= MONTHLY_LEAVE_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"You have already used all {MONTHLY_LEAVE_LIMIT} leaves for {body.start_date.strftime('%B %Y')}.",
        )

    leave = LeaveRequest(
        user_id=user.id,
        request_type="LEAVE",
        start_date=body.start_date,
        end_date=body.end_date,
        reason=body.reason,
    )
    db.add(leave)
    await db.flush()

    admins = await get_admin_users(db)
    for admin in admins:
        await create_notification(
            db, str(admin.id),
            "New Leave Request",
            f"{user.full_name} has submitted a leave request from {body.start_date} to {body.end_date}.",
            link="/leave",
        )

    await db.commit()
    await db.refresh(leave)

    admin_emails = [a.email for a in admins]
    send_leave_notification_email(
        employee_name=user.full_name,
        employee_email=user.email,
        request_type="LEAVE",
        start_date=body.start_date,
        end_date=body.end_date,
        reason=body.reason,
        admin_emails=admin_emails,
    )

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

    if body.status == "APPROVED":
        start, end = _month_range(leave.start_date)
        approved = await _count_leaves_in_month(
            db, leave.user_id, start, end, statuses=["APPROVED"]
        )
        if approved >= MONTHLY_LEAVE_LIMIT:
            raise HTTPException(
                status_code=400,
                detail=f"{leave.user.full_name if leave.user else 'This user'} has already used all {MONTHLY_LEAVE_LIMIT} leaves for this month.",
            )

    leave.status = body.status
    leave.reviewed_by = admin.id
    if body.admin_comment is not None:
        leave.admin_comment = body.admin_comment

    await db.flush()

    await create_notification(
        db, str(leave.user_id),
        f"Leave Request {body.status}",
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
