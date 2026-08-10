import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.user import User
from app.models.project import Project
from app.models.project_document import ProjectDocument
from app.models.project_assignment import ProjectAssignment
from app.schemas.project_document import ProjectDocumentResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

PROJECT_DOC_DIR = "uploads/project_documents"


async def _get_project_or_404(db: AsyncSession, project_id: str) -> Project:
    try:
        pid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")
    result = await db.execute(select(Project).where(Project.id == pid))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def _ensure_access(db: AsyncSession, project: Project, user: User) -> None:
    if user.role.name == "ADMIN":
        return
    if project.owner_id == user.id:
        return
    assign_check = await db.execute(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project.id,
            ProjectAssignment.user_id == user.id,
        )
    )
    if not assign_check.scalar_one_or_none():
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this project's documents.",
        )


def _doc_dir(project_id: str) -> str:
    path = os.path.join(PROJECT_DOC_DIR, project_id)
    os.makedirs(path, exist_ok=True)
    return path


def _serialize(doc: ProjectDocument) -> ProjectDocumentResponse:
    return ProjectDocumentResponse(
        id=str(doc.id),
        project_id=str(doc.project_id),
        user_id=str(doc.user_id),
        user_name=doc.user.full_name if doc.user else None,
        file_url=doc.file_url,
        file_name=doc.file_name,
        content_type=doc.content_type,
        size=doc.size,
        source=doc.source,
        created_at=doc.created_at,
    )


@router.get("/{project_id}/documents", response_model=list[ProjectDocumentResponse])
async def list_project_documents(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = await _get_project_or_404(db, project_id)
    await _ensure_access(db, project, user)

    result = await db.execute(
        select(ProjectDocument)
        .where(ProjectDocument.project_id == project.id)
        .order_by(ProjectDocument.created_at.desc())
    )
    return [_serialize(doc) for doc in result.scalars().all()]


@router.post("/{project_id}/documents", response_model=ProjectDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_project_document(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    file: UploadFile = File(...),
):
    project = await _get_project_or_404(db, project_id)
    await _ensure_access(db, project, user)

    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(_doc_dir(str(project.id)), unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/project_documents/{project.id}/{unique_name}"
    doc = ProjectDocument(
        project_id=project.id,
        user_id=user.id,
        file_url=file_url,
        file_name=file.filename or unique_name,
        content_type=file.content_type,
        size=len(content),
        source="direct",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return _serialize(doc)


@router.get("/{project_id}/documents/{document_id}/download")
async def download_project_document(
    project_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = await _get_project_or_404(db, project_id)
    await _ensure_access(db, project, user)

    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Document not found")

    result = await db.execute(
        select(ProjectDocument).where(ProjectDocument.id == doc_uuid)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    path = os.path.join(PROJECT_DOC_DIR, str(doc.project_id), os.path.basename(doc.file_url))
    if not os.path.exists(path):
        relative = doc.file_url.removeprefix("/uploads/")
        path = os.path.join("uploads", relative)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Document file not found")

    return FileResponse(path, filename=doc.file_name, media_type=doc.content_type)


@router.delete("/{project_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_document(
    project_id: str,
    document_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = await _get_project_or_404(db, project_id)
    await _ensure_access(db, project, user)

    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Document not found")

    result = await db.execute(
        select(ProjectDocument).where(ProjectDocument.id == doc_uuid)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    is_admin = user.role.name == "ADMIN"
    if not is_admin and doc.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the uploader or an admin can delete this document.",
        )

    path = os.path.join(PROJECT_DOC_DIR, str(doc.project_id), os.path.basename(doc.file_url))
    if not os.path.exists(path):
        relative = doc.file_url.removeprefix("/uploads/")
        path = os.path.join("uploads", relative)
    if os.path.exists(path):
        os.remove(path)

    await db.delete(doc)
    await db.commit()
