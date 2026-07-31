import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.notification import Notification
from app.core.config import settings


async def get_admin_users(db: AsyncSession) -> list[User]:
    result = await db.execute(
        select(User).join(User.role).where(User.role.has(name="ADMIN"), User.is_active == True)
    )
    return list(result.scalars().all())


async def create_notification(db: AsyncSession, user_id: str, title: str, message: str, link: str | None = None) -> Notification:
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link,
    )
    db.add(n)
    await db.flush()
    return n


def send_email(to_email: str, subject: str, html_body: str, cc: list[str] | None = None):
    # Mailing system removed in favor of in-app notifications
    pass


def send_leave_notification_email(*args, **kwargs):
    # Mailing system removed in favor of in-app notifications
    pass
