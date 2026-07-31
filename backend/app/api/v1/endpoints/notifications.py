from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()

    return [
        NotificationResponse(
            id=str(n.id),
            user_id=str(n.user_id),
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            link=n.link,
            created_at=n.created_at,
        )
        for n in notifications
    ]


@router.patch("/read-all", response_model=dict)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await db.execute(
        sa_update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)

    return NotificationResponse(
        id=str(notification.id),
        user_id=str(notification.user_id),
        title=notification.title,
        message=notification.message,
        is_read=notification.is_read,
        link=notification.link,
        created_at=notification.created_at,
    )
