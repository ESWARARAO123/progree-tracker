from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.meeting import Meeting, MeetingAssignee
from app.schemas.meeting import CreateMeetingRequest, UpdateMeetingRequest, MeetingResponse
from app.api.v1.endpoints.auth import get_current_user, require_admin

router = APIRouter()


def _serialize(m: Meeting) -> MeetingResponse:
    return MeetingResponse(
        id=str(m.id),
        title=m.title,
        description=m.description,
        date=m.date,
        start_time=m.start_time,
        end_time=m.end_time,
        meeting_link=m.meeting_link,
        mom=m.mom,
        created_by=str(m.created_by),
        created_by_name=m.creator.full_name if m.creator else None,
        assignee_ids=[str(a.user_id) for a in m.assignees],
        assignee_names=[a.user.full_name for a in m.assignees],
        created_at=m.created_at,
    )


@router.get("/", response_model=list[MeetingResponse])
async def list_meetings(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Meeting).options(selectinload(Meeting.assignees))
    if user.role.name != "ADMIN":
        query = query.where(
            (Meeting.created_by == user.id) |
            (Meeting.assignees.any(MeetingAssignee.user_id == user.id)) |
            (~Meeting.assignees.any())
        )
    query = query.order_by(Meeting.date.asc(), Meeting.start_time.asc())
    result = await db.execute(query)
    meetings = result.scalars().all()
    return [_serialize(m) for m in meetings]


@router.post("/", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    body: CreateMeetingRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    meeting = Meeting(
        title=body.title,
        description=body.description,
        date=body.date,
        start_time=body.start_time,
        end_time=body.end_time,
        meeting_link=body.meeting_link,
        mom=body.mom,
        created_by=admin.id,
    )
    db.add(meeting)
    await db.flush()

    for uid in body.assignee_ids:
        db.add(MeetingAssignee(meeting_id=meeting.id, user_id=uid))

    await db.commit()
    await db.refresh(meeting)

    result = await db.execute(
        select(Meeting).where(Meeting.id == meeting.id).options(selectinload(Meeting.assignees))
    )
    m = result.scalar_one()
    return _serialize(m)


@router.put("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(
    meeting_id: str,
    body: UpdateMeetingRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(meeting, field, value)

    # Sync assignees if provided
    if body.assignee_ids is not None:
        await db.execute(sa_delete(MeetingAssignee).where(MeetingAssignee.meeting_id == meeting_id))
        for uid in body.assignee_ids:
            db.add(MeetingAssignee(meeting_id=meeting.id, user_id=uid))

    await db.commit()
    await db.refresh(meeting)

    result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id).options(selectinload(Meeting.assignees))
    )
    m = result.scalar_one()
    return _serialize(m)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(
    meeting_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Meeting not found")
    await db.execute(sa_delete(Meeting).where(Meeting.id == meeting_id))
    await db.commit()
