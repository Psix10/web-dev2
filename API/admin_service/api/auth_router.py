from __future__ import annotations

from fastapi import APIRouter, Depends, status

from api.dependencies import get_auth_service
from schemas.admin_schemas import (
    LoginRequest,
    RefreshRequest,
    LogoutRequest,
    TokenResponse,
)
from services.auth_service import AuthService

router = APIRouter(
    prefix="/api/admin/auth",
    tags=["Admin Auth"],
)


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.login(payload.email, payload.password)


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh(
    payload: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.refresh(payload.refresh_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    payload: LogoutRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    await auth_service.logout(payload.refresh_token)
    return {"message": "Logged out successfully"}