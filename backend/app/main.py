from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

import asyncio
import logging
import os
from pathlib import Path
from alembic import command
from alembic.config import Config
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.base import engine, Base, async_session
from app.db.init_database import ensure_database_exists
from app.models.role import Role
from app.models.user import User
from app.models.project_request import ProjectRequest
from app.core.security import get_password_hash
from app.api.v1.endpoints import (
    auth, users, projects, tasks, updates, leave, notifications,
    audit, dashboard, project_requests, meetings, company_holidays,
    project_chat, uploads, export
)
from sqlalchemy import text as sa_text

logger = logging.getLogger(__name__)


def _run_alembic_upgrade() -> None:
    """Apply pending Alembic migrations (creates the full schema on a fresh DB)."""
    backend_dir = Path(__file__).resolve().parent.parent
    cfg = Config(str(backend_dir / "alembic.ini"))
    cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    command.upgrade(cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Make sure the application database exists (fresh servers).
    # 2. Apply Alembic migrations to create/upgrade the schema.
    loop = asyncio.get_running_loop()
    try:
        await loop.run_in_executor(None, ensure_database_exists)
        await loop.run_in_executor(None, _run_alembic_upgrade)
    except Exception:
        logger.exception("Database bootstrap failed")
        raise

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(sa_text(
            "ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id)"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS current_project_id UUID REFERENCES projects(id)"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE task_updates ADD COLUMN IF NOT EXISTS morning_task_title TEXT"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE task_updates ADD COLUMN IF NOT EXISTS morning_status task_status_enum"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE task_updates ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500)"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE task_updates ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(250)"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500)"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(250)"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE meetings ADD COLUMN IF NOT EXISTS end_time VARCHAR(5)"
        ))
        await conn.execute(sa_text(
            "ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500)"
        ))
        await conn.execute(sa_text(
            "ALTER TYPE request_type_enum ADD VALUE IF NOT EXISTS 'WFBO'"
        ))

    async with async_session() as db:
        role_result = await db.execute(select(Role).where(Role.name == "ADMIN"))
        if not role_result.scalar_one_or_none():
            db.add(Role(name="ADMIN", description="System Administrator"))
            db.add(Role(name="EMPLOYEE", description="Standard Employee"))
            await db.commit()

        admin_result = await db.execute(
            select(User).where(User.email == "admin@sierraedge.ai")
        )
        if not admin_result.scalar_one_or_none():
            role_result = await db.execute(select(Role).where(Role.name == "ADMIN"))
            admin_role = role_result.scalar_one()
            admin_user = User(
                role_id=admin_role.id,
                full_name="Admin",
                email="admin@sierraedge.ai",
                password_hash=get_password_hash("admin123"),
                department="Executive",
                designation="System Administrator",
            )
            db.add(admin_user)
            await db.commit()

    yield

    await engine.dispose()


os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="REST API for Daily Work Tracker Enterprise System",
    lifespan=lifespan,
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = [
    "http://localhost",
    "http://localhost:5111",
    "http://localhost:5173",
    "http://localhost:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(project_chat.router, prefix=f"{settings.API_V1_STR}/projects/chat", tags=["project-chat"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["tasks"])
app.include_router(updates.router, prefix=f"{settings.API_V1_STR}/updates", tags=["updates"])
app.include_router(leave.router, prefix=f"{settings.API_V1_STR}/leave", tags=["leave"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["notifications"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["audit"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])
app.include_router(project_requests.router, prefix=f"{settings.API_V1_STR}/project-requests", tags=["project-requests"])
app.include_router(meetings.router, prefix=f"{settings.API_V1_STR}/meetings", tags=["meetings"])
app.include_router(company_holidays.router, prefix=f"{settings.API_V1_STR}/company-holidays", tags=["company-holidays"])
app.include_router(uploads.router, prefix=f"{settings.API_V1_STR}/uploads", tags=["uploads"])
app.include_router(export.router, prefix=f"{settings.API_V1_STR}/export", tags=["export"])



@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "documentation": "/docs",
    }


@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "service": "Daily Work Tracker API"}
