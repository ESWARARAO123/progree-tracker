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
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL] SMTP not configured. Would send to {to_email}, CC {cc or []}: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = to_email
    if cc:
        msg["Cc"] = ", ".join(cc)

    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email] + (cc or []), msg.as_string())
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to_email}: {e}")


def send_leave_notification_email(
    employee_name: str,
    employee_email: str,
    request_type: str,
    start_date: date,
    end_date: date,
    reason: str,
    admin_emails: list[str],
):
    subject = f"[Leave Request] {request_type} - {employee_name} ({start_date} to {end_date})"

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; background: #ffffff; border-radius: 8px; padding: 25px; border-top: 4px solid #f59e0b;">
          <h2 style="color: #1e293b;">New {request_type} Request</h2>
          <p>Employee <strong>{employee_name}</strong> has submitted a new {request_type} request requiring your review.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;">Type:</td><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">{request_type}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0;">From:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">{start_date}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;">To:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">{end_date}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0;">Reason:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">{reason}</td></tr>
          </table>
          <p>Please log in to the system to approve or reject this request.</p>
          <div style="margin-top: 25px; font-size: 12px; color: #64748b;">Daily Work Tracker - Automated Notification</div>
        </div>
      </body>
    </html>
    """

    for admin_email in admin_emails:
        send_email(admin_email, subject, body)

    if admin_emails:
        send_email(employee_email, f"Confirmation: {request_type} Request Submitted", f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; background: #ffffff; border-radius: 8px; padding: 25px; border-top: 4px solid #10b981;">
              <h2 style="color: #1e293b;">{request_type} Request Submitted</h2>
              <p>Your {request_type} request from <strong>{start_date}</strong> to <strong>{end_date}</strong> has been submitted successfully and is pending admin review.</p>
              <p>You will receive a notification once it is approved or rejected.</p>
              <div style="margin-top: 25px; font-size: 12px; color: #64748b;">Daily Work Tracker - Automated Notification</div>
            </div>
          </body>
        </html>
        """)
