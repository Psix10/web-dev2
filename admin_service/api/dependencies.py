# api/dependencies.py
from __future__ import annotations

import os
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from dao.admin_dao import AdminDAO
from db.db import get_session
from models.admin_models import Admin
from services.auth_service import AuthService
from services.password_service import PasswordService
from services.token_service import TokenService


bearer_scheme = HTTPBearer(auto_error=False)


def get_password_service() -> PasswordService:
    return PasswordService()


def get_token_service() -> TokenService:
    return TokenService(
        secret_key=os.getenv("JWT_SECRET_KEY", "dev-secret"),
        algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")),
        refresh_token_expire_days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")),
    )


def get_admin_dao(session: AsyncSession = Depends(get_session)) -> AdminDAO:
    return AdminDAO(session)


def get_auth_service(
    dao: AdminDAO = Depends(get_admin_dao),
    token_service: TokenService = Depends(get_token_service),
    password_service: PasswordService = Depends(get_password_service),
) -> AuthService:
    return AuthService(
        dao=dao,
        token_service=token_service,
        password_service=password_service,
    )


async def get_current_admin_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    token_service: TokenService = Depends(get_token_service),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
        )

    token = credentials.credentials
    payload = token_service.decode_token(token)
    token_service.require_token_type(payload, "access")

    if payload.get("principal_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin token required",
        )

    if payload.get("sub") is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return payload


async def get_current_admin(
    payload: dict[str, Any] = Depends(get_current_admin_payload),
    session: AsyncSession = Depends(get_session),
) -> Admin:
    admin_id = int(payload["sub"])
    dao = AdminDAO(session)
    admin = await dao.get_admin_by_id(admin_id)

    if admin is None or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found or inactive",
        )

    return admin


def require_permissions(*required_permissions: str):
    async def permission_checker(
        payload: dict[str, Any] = Depends(get_current_admin_payload),
    ) -> dict[str, Any]:
        user_permissions = set(payload.get("permissions", []))

        missing_permissions = [
            permission
            for permission in required_permissions
            if permission not in user_permissions
        ]

        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permissions: {', '.join(missing_permissions)}",
            )

        return payload

    return permission_checker