import asyncio
from datetime import date, datetime, timezone

from celery import Celery
from celery.schedules import crontab
from sqlalchemy import select, update as sa_update

from app.core.config import settings
from app.db.base import async_session
from app.models.leave_request import LeaveRequest
from app.models.task_update import TaskUpdate
from app.models.user import User


celery_app = Celery(
    "daily_tracker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=False,
    task_track_started=True,
)

celery_app.conf.beat_schedule = {
    "nightly-10pm-missing-updates-scan": {
        "task": "app.tasks.celery_app.nightly_scan",
        "schedule": crontab(hour=22, minute=0),
    }
}


@celery_app.task(name="app.tasks.celery_app.nightly_scan")
def nightly_scan():
    """10 PM scan: lock today's updates and notify employees missing them."""
    return asyncio.run(_run_nightly_scan())


async def _run_nightly_scan():
    today = date.today()

    async with async_session() as db:
        active_users = (
            await db.execute(
                select(User).where(User.is_active == True)
            )
        ).scalars().all()

        approved_leaves = (
            await db.execute(
                select(LeaveRequest).where(
                    LeaveRequest.status == "APPROVED",
                    LeaveRequest.start_date <= today,
                    LeaveRequest.end_date >= today,
                )
            )
        ).scalars().all()
        on_leave_ids = {str(lr.user_id) for lr in approved_leaves}

        existing_updates = (
            await db.execute(
                select(TaskUpdate).where(TaskUpdate.report_date == today)
            )
        ).scalars().all()
        update_by_user = {str(u.user_id): u for u in existing_updates}

        missing = []
        for user in active_users:
            if str(user.id) in on_leave_ids:
                continue
            upd = update_by_user.get(str(user.id))
            if upd is None or not upd.morning_submitted_at or not upd.evening_submitted_at:
                missing.append(user)

        await db.execute(
            sa_update(TaskUpdate.__table__)
            .where(TaskUpdate.report_date == today)
            .values(is_locked=True)
        )

        from app.models.notification import Notification

        for user in missing:
            db.add(
                Notification(
                    user_id=user.id,
                    title="Missed Update",
                    message=(
                        f"Hi {user.full_name}, today's daily update is now locked. "
                        "Please submit your update on time tomorrow."
                    ),
                    link="/updates",
                )
            )

        await db.commit()

    return {
        "scanned": len(active_users),
        "missing": len(missing),
        "locked_date": str(today),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
