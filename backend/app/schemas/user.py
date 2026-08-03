from pydantic import BaseModel
from typing import Any


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    department: str | None
    designation: str | None
    is_active: bool
    current_project_id: str | None = None
    preferences: dict[str, Any] = {}

    class Config:
        from_attributes = True


class CreateUserResponse(UserResponse):
    generated_password: str | None = None


class UpdatePreferencesRequest(BaseModel):
    preferences: dict[str, Any]


class CreateUserRequest(BaseModel):
    full_name: str
    email: str
    password: str | None = None
    role: str = "EMPLOYEE"
    department: str | None = None
    designation: str | None = None


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    password: str | None = None
    role: str | None = None
    department: str | None = None
    designation: str | None = None
    is_active: bool | None = None
