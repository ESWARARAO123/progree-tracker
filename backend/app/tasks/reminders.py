import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
from app.core.config import settings

def run_10pm_missing_updates_scan():
    """
    Executes nightly at 10:00 PM.
    Identifies all active non-leave employees missing morning or evening updates,
    locks today's records, and triggers automated email reminders (To: Employee, CC: All Admins).
    """
    print(f"[{date.today()}] Running 10:00 PM Daily Work Update Scan...")
    
    # Mock delinquent list query results
    missing_employees = [
        {
            "name": "David Miller",
            "email": "david.miller@company.com",
            "missing_type": "Evening Update",
            "pending_tasks": 3
        }
    ]
    
    admin_emails = ["admin@company.com", "lead.admin@company.com"]
    
    for emp in missing_employees:
        send_missed_update_email(
            employee_name=emp["name"],
            employee_email=emp["email"],
            missing_type=emp["missing_type"],
            pending_tasks_count=emp["pending_tasks"],
            admin_cc=admin_emails
        )
    return {"scanned": 15, "reminders_sent": len(missing_employees)}

def send_missed_update_email(employee_name: str, employee_email: str, missing_type: str, pending_tasks_count: int, admin_cc: list):
    subject = f"[ACTION REQUIRED] Missing Daily Work Update - {date.today()} | {employee_name}"
    
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; background: #ffffff; border-radius: 8px; padding: 25px; border-top: 4px solid #ef4444;">
          <h2 style="color: #1e293b;">Daily Work Tracker - Missing Update Alert</h2>
          <p>Dear <strong>{employee_name}</strong>,</p>
          <p>Our automated monitoring system detected that you have not submitted your required daily work updates for <strong>{date.today()}</strong> before the 10:00 PM lock window.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #e2e8f0;">Missing Submission:</td><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ef4444;">{missing_type}</td></tr>
            <tr><td style="padding: 10px; border: 1px solid #e2e8f0;">Pending Tasks:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">{pending_tasks_count} Tasks Assigned</td></tr>
          </table>
          <p>This missed update has been logged in the system audit records and CC'd to all System Administrators.</p>
          <div style="margin-top: 25px; font-size: 12px; color: #64748b;">Daily Work Tracker Automated Notification System.</div>
        </div>
      </body>
    </html>
    """
    
    print(f"Sending email to {employee_email} with CC to {', '.join(admin_cc)}...")
    # SMTP logic would execute here using settings.SMTP_HOST
    return True
