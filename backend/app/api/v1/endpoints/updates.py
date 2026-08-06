from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.task_update import TaskUpdate
from app.schemas.update import MorningUpdateRequest, EveningUpdateRequest, TaskUpdateResponse
from app.api.v1.endpoints.auth import get_current_user, require_admin
from app.core.notify import get_admin_users, create_notification

router = APIRouter()


@router.get("/", response_model=list[TaskUpdateResponse])
async def list_updates(
    report_date: date | None = None,
    user_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(TaskUpdate).options(
        selectinload(TaskUpdate.user),
        selectinload(TaskUpdate.project),
        selectinload(TaskUpdate.task),
    )

    if user.role.name != "ADMIN":
        query = query.where(TaskUpdate.user_id == user.id)
    elif user_id:
        query = query.where(TaskUpdate.user_id == user_id)

    if report_date:
        query = query.where(TaskUpdate.report_date == report_date)

    query = query.order_by(TaskUpdate.report_date.desc(), TaskUpdate.morning_submitted_at.asc().nullslast(), TaskUpdate.created_at.asc())
    result = await db.execute(query)
    updates = result.scalars().all()

    return [
        TaskUpdateResponse(
            id=str(u.id),
            user_id=str(u.user_id),
            user_name=u.user.full_name if u.user else None,
            project_id=str(u.project_id) if u.project_id else None,
            task_id=str(u.task_id) if u.task_id else None,
            report_date=u.report_date,
            morning_planned_work=u.morning_planned_work,
            morning_task_title=u.morning_task_title,
            morning_status=u.morning_status,
            morning_est_hours=float(u.morning_est_hours) if u.morning_est_hours else None,
            morning_blockers=u.morning_blockers,
            morning_submitted_at=u.morning_submitted_at,
            evening_completed_work=u.evening_completed_work,
            evening_remaining_work=u.evening_remaining_work,
            evening_hours_spent=float(u.evening_hours_spent) if u.evening_hours_spent else None,
            evening_challenges=u.evening_challenges,
            evening_next_day_plan=u.evening_next_day_plan,
            evening_submitted_at=u.evening_submitted_at,
            attachment_url=u.attachment_url,
            attachment_name=u.attachment_name,
            is_locked=u.is_locked,
        )
        for u in updates
    ]


@router.post("/morning", response_model=TaskUpdateResponse, status_code=status.HTTP_201_CREATED)
async def submit_morning_update(
    body: MorningUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()

    existing = await db.execute(
        select(TaskUpdate).where(
            TaskUpdate.user_id == user.id,
            TaskUpdate.report_date == today,
        )
    )
    update = existing.scalar_one_or_none()

    if update:
        if update.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Updates for today are locked",
            )
        update.project_id = body.project_id
        update.task_id = body.task_id
        update.morning_task_title = body.morning_task_title
        update.morning_planned_work = body.planned_work
        update.morning_est_hours = body.est_hours
        update.morning_blockers = body.blockers
        if body.attachment_url:
            update.attachment_url = body.attachment_url
        if body.attachment_name:
            update.attachment_name = body.attachment_name
        update.morning_submitted_at = datetime.now(timezone.utc)
    else:
        update = TaskUpdate(
            user_id=user.id,
            project_id=body.project_id,
            task_id=body.task_id,
            report_date=today,
            morning_task_title=body.morning_task_title,
            morning_planned_work=body.planned_work,
            morning_est_hours=body.est_hours,
            morning_blockers=body.blockers,
            attachment_url=body.attachment_url,
            attachment_name=body.attachment_name,
            morning_submitted_at=datetime.now(timezone.utc),
        )
        db.add(update)

    admins = await get_admin_users(db)
    for admin_user in admins:
        await create_notification(
            db,
            str(admin_user.id),
            "New Morning Update",
            f"{user.full_name} submitted a morning update for {today}.",
            link="/updates",
        )

    await db.commit()
    await db.refresh(update)

    result = await db.execute(
        select(TaskUpdate).where(TaskUpdate.id == update.id).options(
            selectinload(TaskUpdate.user),
            selectinload(TaskUpdate.project),
            selectinload(TaskUpdate.task),
        )
    )
    u = result.scalar_one()

    return TaskUpdateResponse(
        id=str(u.id),
        user_id=str(u.user_id),
        user_name=u.user.full_name if u.user else None,
        project_id=str(u.project_id) if u.project_id else None,
        task_id=str(u.task_id) if u.task_id else None,
        report_date=u.report_date,
        morning_planned_work=u.morning_planned_work,
        morning_task_title=u.morning_task_title,
        morning_status=u.morning_status,
        morning_est_hours=float(u.morning_est_hours) if u.morning_est_hours else None,
        morning_blockers=u.morning_blockers,
        morning_submitted_at=u.morning_submitted_at,
        evening_completed_work=u.evening_completed_work,
        evening_remaining_work=u.evening_remaining_work,
        evening_hours_spent=float(u.evening_hours_spent) if u.evening_hours_spent else None,
        evening_challenges=u.evening_challenges,
        evening_next_day_plan=u.evening_next_day_plan,
        evening_submitted_at=u.evening_submitted_at,
        attachment_url=u.attachment_url,
        attachment_name=u.attachment_name,
        is_locked=u.is_locked,
    )


@router.post("/evening", response_model=TaskUpdateResponse)
async def submit_evening_update(
    body: EveningUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()

    existing = await db.execute(
        select(TaskUpdate).where(
            TaskUpdate.user_id == user.id,
            TaskUpdate.report_date == today,
        )
    )
    update = existing.scalar_one_or_none()

    if not update:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No morning update found for today. Submit morning update first.",
        )

    if update.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Updates for today are locked",
        )

    if not update.morning_submitted_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Morning update not yet submitted",
        )

    update.evening_completed_work = body.completed_work
    update.evening_remaining_work = body.remaining_work
    update.evening_hours_spent = body.hours_spent
    update.evening_challenges = body.challenges
    update.evening_next_day_plan = body.next_day_plan
    if body.attachment_url:
        update.attachment_url = body.attachment_url
    if body.attachment_name:
        update.attachment_name = body.attachment_name
    update.evening_submitted_at = datetime.now(timezone.utc)

    admins = await get_admin_users(db)
    for admin_user in admins:
        await create_notification(
            db,
            str(admin_user.id),
            "New Evening Update",
            f"{user.full_name} submitted an evening update for {today}.",
            link="/updates",
        )

    await db.commit()
    await db.refresh(update)

    result = await db.execute(
        select(TaskUpdate).where(TaskUpdate.id == update.id).options(
            selectinload(TaskUpdate.user),
            selectinload(TaskUpdate.project),
            selectinload(TaskUpdate.task),
        )
    )
    u = result.scalar_one()

    return TaskUpdateResponse(
        id=str(u.id),
        user_id=str(u.user_id),
        user_name=u.user.full_name if u.user else None,
        project_id=str(u.project_id) if u.project_id else None,
        task_id=str(u.task_id) if u.task_id else None,
        report_date=u.report_date,
        morning_planned_work=u.morning_planned_work,
        morning_task_title=u.morning_task_title,
        morning_status=u.morning_status,
        morning_est_hours=float(u.morning_est_hours) if u.morning_est_hours else None,
        morning_blockers=u.morning_blockers,
        morning_submitted_at=u.morning_submitted_at,
        evening_completed_work=u.evening_completed_work,
        evening_remaining_work=u.evening_remaining_work,
        evening_hours_spent=float(u.evening_hours_spent) if u.evening_hours_spent else None,
        evening_challenges=u.evening_challenges,
        evening_next_day_plan=u.evening_next_day_plan,
        evening_submitted_at=u.evening_submitted_at,
        attachment_url=u.attachment_url,
        attachment_name=u.attachment_name,
        is_locked=u.is_locked,
    )


@router.post("/lock")
async def lock_today_updates(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    today = date.today()
    await db.execute(
        sa_update(TaskUpdate.__table__)
        .where(TaskUpdate.report_date == today)
        .values(is_locked=True)
    )
    await db.commit()
    return {"message": "All today's updates have been locked"}
