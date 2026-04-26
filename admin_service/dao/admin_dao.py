from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.admin_models import Admin, Role, AdminSession, Permission


class AdminDAO:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_admin_by_email(self, email: str) -> Admin | None:
        stmt = (
            select(Admin)
            .where(Admin.email == email)
            .options(
                selectinload(Admin.role).selectinload(Role.permissions)
            )
        )
        return await self.session.scalar(stmt)

    async def get_admin_by_id(self, admin_id: int) -> Admin | None:
        stmt = (
            select(Admin)
            .where(Admin.id == admin_id)
            .options(
                selectinload(Admin.role).selectinload(Role.permissions),
                selectinload(Admin.sessions),
            )
        )
        return await self.session.scalar(stmt)

    async def list_admins(self) -> list[Admin]:
        stmt = (
            select(Admin)
            .options(selectinload(Admin.role).selectinload(Role.permissions))
            .order_by(Admin.id.asc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def create_admin(
        self,
        *,
        first_name: str,
        last_name: str,
        email: str,
        password_hash: str,
        role_id: int,
        is_active: bool = True,
    ) -> Admin:
        admin = Admin(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=password_hash,
            role_id=role_id,
            is_active=is_active,
        )
        self.session.add(admin)
        await self.session.flush()
        return admin

    async def update_admin(
        self,
        admin: Admin,
        *,
        first_name: str,
        last_name: str,
        email: str,
        role_id: int,
        is_active: bool,
        password_hash: str | None = None,
    ) -> Admin:
        admin.first_name = first_name
        admin.last_name = last_name
        admin.email = email
        admin.role_id = role_id
        admin.is_active = is_active

        if password_hash is not None:
            admin.password_hash = password_hash

        await self.session.flush()
        return admin

    async def list_roles(self) -> list[Role]:
        stmt = (
            select(Role)
            .options(selectinload(Role.permissions))
            .order_by(Role.id.asc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_role_by_id(self, role_id: int) -> Role | None:
        stmt = (
            select(Role)
            .where(Role.id == role_id)
            .options(selectinload(Role.permissions))
        )
        return await self.session.scalar(stmt)

    async def get_role_by_name(self, role_name: str) -> Role | None:
        stmt = (
            select(Role)
            .where(Role.name == role_name)
            .options(selectinload(Role.permissions))
        )
        return await self.session.scalar(stmt)

    async def create_role(self, name: str, description: str) -> Role:
        role = Role(
            name=name,
            description=description,
        )
        self.session.add(role)
        await self.session.flush()
        return role

    async def create_session(
        self,
        *,
        admin_id: int,
        refresh_token_hash: str,
        expires_at: datetime,
    ) -> AdminSession:
        session_obj = AdminSession(
            admin_id=admin_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
        )
        self.session.add(session_obj)
        await self.session.flush()
        return session_obj

    async def get_active_session_by_refresh_hash(self, refresh_token_hash: str,) -> AdminSession | None:
        stmt = select(AdminSession).where(
            AdminSession.refresh_token_hash == refresh_token_hash,
            AdminSession.revoked_at.is_(None),
        )
        return await self.session.scalar(stmt)


    async def revoke_session(self, session_id: int, revoked_at: datetime) -> None:
        session_obj = await self.session.get(AdminSession, session_id)
        if session_obj is None:
            return

        session_obj.revoked_at = revoked_at
        await self.session.flush()

    async def get_sessions_by_admin_id(self, admin_id: int) -> list[AdminSession]:
        stmt = (
            select(AdminSession)
            .where(AdminSession.admin_id == admin_id)
            .order_by(AdminSession.id.asc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def revoke_session(self, session_id: int, revoked_at: datetime) -> None:
        session_obj = await self.session.get(AdminSession, session_id)
        if session_obj is None:
            return

        session_obj.revoked_at = revoked_at
        await self.session.flush()

    async def list_permissions(self) -> list[Permission]:
        stmt = select(Permission).order_by(Permission.id.asc())
        result = await self.session.scalars(stmt)
        return list(result.all())


    async def get_permission_by_id(self, permission_id: int) -> Permission | None:
        stmt = select(Permission).where(Permission.id == permission_id)
        return await self.session.scalar(stmt)


    async def get_permission_by_code(self, code: str) -> Permission | None:
        stmt = select(Permission).where(Permission.code == code)
        return await self.session.scalar(stmt)


    async def create_permission(
        self,
        *,
        code: str,
        description: str | None = None,
    ) -> Permission:
        permission = Permission(
            code=code,
            description=description,
        )
        self.session.add(permission)
        await self.session.flush()
        return permission


    async def update_role_fields(
        self,
        role: Role,
        *,
        name: str,
        description: str | None,
    ) -> Role:
        role.name = name
        role.description = description
        await self.session.flush()
        return role


    async def assign_permission_to_role(
        self,
        role: Role,
        permission: Permission,
    ) -> Role:
        if permission not in role.permissions:
            role.permissions.append(permission)
            await self.session.flush()
        return role


    async def remove_permission_from_role(
        self,
        role: Role,
        permission: Permission,
    ) -> Role:
        if permission in role.permissions:
            role.permissions.remove(permission)
            await self.session.flush()
        return role