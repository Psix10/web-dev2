from fastapi import APIRouter, Depends, Request, status

from api.dependencies import get_auth_service, get_current_active_user
from services.auth_services import AuthService
from schemas.auth_schemas import (
    UserCreate,
    UserLogin,
    AuthResponse,
    RefreshTokenRequest,
    RefreshResponse,
    LogoutRequest,
    UserRead,
    MessageResponse,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    return await auth_service.register_user(
        payload=payload,
        user_agent=user_agent,
        ip_address=ip_address,
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: UserLogin,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    return await auth_service.login_user(
        payload=payload,
        user_agent=user_agent,
        ip_address=ip_address,
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_tokens(
    payload: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.refresh_tokens(payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: LogoutRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.logout(payload.refresh_token)


@router.get("/me", response_model=UserRead)
async def get_me(current_user=Depends(get_current_active_user)):
    return current_user