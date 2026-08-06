from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.user import User
from app.models.project import Project
from app.models.project_chat import ProjectChat
from app.api.v1.endpoints.auth import get_current_user
import os, uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class CreateChatMessageRequest(BaseModel):
    message: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None


class ChatMessageResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    user_name: str
    user_email: str
    user_designation: Optional[str] = None
    message: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    created_at: str


@router.get("/{project_id}", response_model=list[ChatMessageResponse])
async def list_project_messages(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Verify project exists
    proj_res = await db.execute(select(Project).where(Project.id == UUID(project_id)))
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = (
        select(ProjectChat)
        .where(ProjectChat.project_id == UUID(project_id))
        .options(selectinload(ProjectChat.user))
        .order_by(ProjectChat.created_at.asc())
    )
    res = await db.execute(query)
    messages = res.scalars().all()

    return [
        ChatMessageResponse(
            id=str(msg.id),
            project_id=str(msg.project_id),
            user_id=str(msg.user_id),
            user_name=msg.user.full_name if msg.user else "Unknown",
            user_email=msg.user.email if msg.user else "",
            user_designation=msg.user.designation if msg.user else None,
            message=msg.message,
            file_url=msg.file_url,
            file_name=msg.file_name,
            created_at=msg.created_at.isoformat() if msg.created_at else "",
        )
        for msg in messages
    ]


@router.post("/{project_id}", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def post_project_message(
    project_id: str,
    body: CreateChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    proj_res = await db.execute(select(Project).where(Project.id == UUID(project_id)))
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    chat_msg = ProjectChat(
        project_id=UUID(project_id),
        user_id=user.id,
        message=body.message,
        file_url=body.file_url,
        file_name=body.file_name,
    )
    db.add(chat_msg)
    await db.commit()
    await db.refresh(chat_msg)

    # Fetch loaded user
    res = await db.execute(
        select(ProjectChat).where(ProjectChat.id == chat_msg.id).options(selectinload(ProjectChat.user))
    )
    loaded_msg = res.scalar_one()

    return ChatMessageResponse(
        id=str(loaded_msg.id),
        project_id=str(loaded_msg.project_id),
        user_id=str(loaded_msg.user_id),
        user_name=loaded_msg.user.full_name if loaded_msg.user else user.full_name,
        user_email=loaded_msg.user.email if loaded_msg.user else user.email,
        user_designation=loaded_msg.user.designation if loaded_msg.user else user.designation,
        message=loaded_msg.message,
        file_url=loaded_msg.file_url,
        file_name=loaded_msg.file_name,
        created_at=loaded_msg.created_at.isoformat() if loaded_msg.created_at else "",
    )


@router.post("/{project_id}/upload", status_code=status.HTTP_201_CREATED)
async def upload_chat_file(
    project_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    file_url = f"/uploads/{unique_name}"
    return {
        "file_url": file_url,
        "file_name": file.filename or unique_name,
    }
