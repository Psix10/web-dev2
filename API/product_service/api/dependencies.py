from __future__ import annotations

from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer

from core.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8004/api/auth/login")
admin_bearer_scheme = HTTPBearer(auto_error=False)


# =========================
# USER AUTH
# =========================

async def get_current_token_payload(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except HTTPException:
        raise credentials_exception

    if payload.get("type") != "access":
        raise credentials_exception

    if not payload.get("sub"):
        raise credentials_exception

    return payload


async def get_current_user_id(payload: dict = Depends(get_current_token_payload)) -> int:
    try:
        return int(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_email(payload: dict = Depends(get_current_token_payload)) -> str:
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email claim is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return email


# =========================
# ADMIN AUTH
# =========================

async def get_current_admin_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(admin_bearer_scheme),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required",
        )

    if payload.get("iss") != "admin_service":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin token required",
        )

    if payload.get("token_type") != "admin_access":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access token required",
        )

    if payload.get("sub") is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return payload


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