from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_admin, get_current_admin_payload, require_permissions
from dao.admin_dao import AdminDAO
from schemas.admin_schemas import (
    AdminCreate,
    AdminUpdate,
    AdminRead,
    MeResponse,
    RoleRead,
    RoleCreate,
    RoleUpdate,
    PermissionCreate,
    PermissionRead
)
from db.db import get_session
from models.admin_models import Admin
from services.admin_utils import hash_password


router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(get_current_admin_payload)])


@router.get("/me", response_model=MeResponse)
async def get_me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin


@router.get(
    "/users",
    response_model=list[AdminRead],
    dependencies=[Depends(require_permissions("admin:manage_users"))],
)
async def get_users(
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)
    return await dao.list_admins()


@router.post(
    "/users",
    response_model=AdminRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("admin:manage_users"))],
)
async def create_user(
    payload: AdminCreate,
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)

    role = await dao.get_role_by_id(payload.role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    existing = await dao.get_admin_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    admin = await dao.create_admin(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role_id=payload.role_id,
        is_active=payload.is_active,
    )

    await db.commit()

    created_admin = await dao.get_admin_by_id(admin.id)
    if created_admin is None:
        raise HTTPException(status_code=500, detail="Created admin not found")

    return created_admin


@router.put(
    "/users/{admin_id}",
    response_model=AdminRead,
    dependencies=[Depends(require_permissions("admin:manage_users"))],
)
async def update_user(
    admin_id: int,
    payload: AdminUpdate,
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)

    admin = await dao.get_admin_by_id(admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    role = await dao.get_role_by_id(payload.role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    password_hash = hash_password(payload.password) if payload.password else None

    await dao.update_admin(
        admin,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        role_id=payload.role_id,
        is_active=payload.is_active,
        password_hash=password_hash,
    )

    await db.commit()
    await db.refresh(admin)
    return admin


@router.get(
    "/roles",
    response_model=list[RoleRead],
    dependencies=[Depends(require_permissions("admin:manage_roles"))],
)
async def get_roles(
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)
    return await dao.list_roles()

@router.post(
    "/roles",
    response_model=RoleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("admin:manage_roles"))],
)
async def create_role(
    payload: RoleCreate,
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)

    existing = await dao.get_role_by_name(payload.name)
    if existing:
        raise HTTPException(status_code=409, detail="Role already exists")

    role = await dao.create_role(
        name=payload.name,
        description=payload.description,
    )
    await db.commit()

    created_role = await dao.get_role_by_id(role.id)
    if created_role is None:
        raise HTTPException(status_code=500, detail="Created role not found")

    return created_role

@router.put(
    "/roles/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permissions("admin:manage_roles"))],
)
async def update_role(
    role_id: int,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)

    role = await dao.get_role_by_id(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    existing = await dao.get_role_by_name(payload.name)
    if existing and existing.id != role_id:
        raise HTTPException(status_code=409, detail="Role name already exists")

    await dao.update_role_fields(
        role,
        name=payload.name,
        description=payload.description,
    )
    await db.commit()

    updated_role = await dao.get_role_by_id(role_id)
    if updated_role is None:
        raise HTTPException(status_code=500, detail="Updated role not found")

    return updated_role

@router.get(
    "/permissions",
    response_model=list[PermissionRead],
    dependencies=[Depends(require_permissions("admin:manage_roles"))],
)
async def get_permissions(
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)
    return await dao.list_permissions()


@router.post(
    "/permissions",
    response_model=PermissionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permissions("admin:manage_roles"))],
)
async def create_permission(
    payload: PermissionCreate,
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)

    existing = await dao.get_permission_by_code(payload.code)
    if existing:
        raise HTTPException(status_code=409, detail="Permission already exists")

    permission = await dao.create_permission(
        code=payload.code,
        description=payload.description,
    )
    await db.commit()
    return permission

@router.post(
    "/roles/{role_id}/permissions/{permission_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permissions("admin:manage_roles"))],
)
async def add_permission_to_role(
    role_id: int,
    permission_id: int,
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)

    role = await dao.get_role_by_id(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    permission = await dao.get_permission_by_id(permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    await dao.assign_permission_to_role(role, permission)
    await db.commit()

    updated_role = await dao.get_role_by_id(role_id)
    if updated_role is None:
        raise HTTPException(status_code=500, detail="Updated role not found")

    return updated_role

@router.delete(
    "/roles/{role_id}/permissions/{permission_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permissions("admin:manage_roles"))],
)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    db: AsyncSession = Depends(get_session),
):
    dao = AdminDAO(db)

    role = await dao.get_role_by_id(role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    permission = await dao.get_permission_by_id(permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")

    await dao.remove_permission_from_role(role, permission)
    await db.commit()

    updated_role = await dao.get_role_by_id(role_id)
    if updated_role is None:
        raise HTTPException(status_code=500, detail="Updated role not found")

    return updated_role