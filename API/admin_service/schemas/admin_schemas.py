# admin_service/schemas/admin_schemas.py
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    description: str | None = None


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    permissions: list[PermissionRead] = []


class AdminBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role_id: int
    is_active: bool = True


class AdminCreate(AdminBase):
    password: str


class AdminUpdate(AdminBase):
    password: str | None = None


class AdminRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    updated_at: datetime
    role: RoleRead


class MeResponse(AdminRead):
    pass



class PermissionCreate(BaseModel):
    code: str
    description: str | None = None


class PermissionRead(BaseModel):
    id: int
    code: str
    description: str | None = None

    model_config = {"from_attributes": True}


class RoleCreate(BaseModel):
    name: str
    description: str | None = None


class RoleUpdate(BaseModel):
    name: str
    description: str | None = None

class RoleRead(BaseModel):
    id: int
    name: str
    description: str | None = None
    permissions: list[PermissionRead] = []

    model_config = ConfigDict(from_attributes=True)