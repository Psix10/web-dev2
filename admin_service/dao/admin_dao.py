# admin_service/dao/admin_dao.py
from __future__ import annotations

from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from admin_service.models.admin_models import (
    Admin,
    Role,
    Permission,
    AdminSession,
)


class AdminDAO:
    def __init__(self, session: Session):
        self.session = session

    def get_admin_by_email(self, email: str) -> Admin | None:
        stmt = (
            select(Admin)
            .where(Admin.email == email)
            .options(
                selectinload(Admin.role).selectinload(Role.permissions)
            )
        )
        return self.session.scalar(stmt)

    def get_admin_by_id(self, admin_id: int) -> Admin | None:
        stmt = (
            select(Admin)
            .where(Admin.id == admin_id)
            .options(
                selectinload(Admin.role).selectinload(Role.permissions),
                selectinload(Admin.sessions),
            )
        )
        return self.session.scalar(stmt)

    def list_admins(self) -> list[Admin]:
        stmt = (
            select(Admin)
            .options(selectinload(Admin.role))
            .order_by(Admin.id.asc())
        )
        return list(self.session.scalars(stmt).all())

    def create_admin(
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
        self.session.flush()
        return admin

    def update_admin(
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

        if password_hash:
            admin.password_hash = password_hash

        return admin

    def list_roles(self) -> list[Role]:
        stmt = (
            select(Role)
            .options(selectinload(Role.permissions))
            .order_by(Role.id.asc())
        )
        return list(self.session.scalars(stmt).all())

    def get_role_by_id(self, role_id: int) -> Role | None:
        return self.session.get(Role, role_id)

    def create_session(
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
        self.session.flush()
        return session_obj

    def get_session_by_refresh_hash(self, refresh_token_hash: str) -> AdminSession | None:
        stmt = select(AdminSession).where(AdminSession.refresh_token_hash == refresh_token_hash)
        return self.session.scalar(stmt)

    def delete_session(self, session_obj: AdminSession) -> None:
        self.session.delete(session_obj)