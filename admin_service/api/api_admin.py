# admin_service/api/admin_api.py
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from admin_service.db.db import get_session
from admin_service.dao.admin_dao import AdminDAO
from admin_service.models.admin_models import Admin
from admin_service.schemas.admin_schemas import (
    LoginRequest,
    RefreshRequest,
    LogoutRequest,
    TokenResponse,
    AdminCreate,
    AdminUpdate,
    AdminRead,
    MeResponse,
    RoleRead,
)
from admin_service.api.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/auth/login")


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_session),
) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        admin_id = payload.get("sub")
        token_type = payload.get("type")
        if admin_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    dao = AdminDAO(db)
    admin = dao.get_admin_by_id(int(admin_id))
    if admin is None or not admin.is_active:
        raise credentials_exception
    return admin


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_session)):
    dao = AdminDAO(db)
    admin = dao.get_admin_by_email(payload.email)

    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin is inactive")

    access_token = create_access_token(str(admin.id))
    refresh_token = create_refresh_token(str(admin.id))

    refresh_token_hash = hash_password(refresh_token)
    dao.create_session(
        admin_id=admin.id,
        refresh_token_hash=refresh_token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/auth/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_session)):
    try:
        token_data = decode_token(payload.refresh_token)
        admin_id = token_data.get("sub")
        token_type = token_data.get("type")
        if token_type != "refresh" or admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    dao = AdminDAO(db)
    admin = dao.get_admin_by_id(int(admin_id))
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Admin not found")

    access_token = create_access_token(str(admin.id))
    refresh_token = create_refresh_token(str(admin.id))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/auth/logout")
def logout(payload: LogoutRequest):
    return {"message": "Logged out"}


@router.get("/me", response_model=MeResponse)
def get_me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin


@router.get("/users", response_model=list[AdminRead])
def get_users(
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    dao = AdminDAO(db)
    return dao.list_admins()


@router.post("/users", response_model=AdminRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreate,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    dao = AdminDAO(db)
    role = dao.get_role_by_id(payload.role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    existing = dao.get_admin_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    admin = dao.create_admin(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role_id=payload.role_id,
        is_active=payload.is_active,
    )
    db.commit()
    db.refresh(admin)
    return admin


@router.put("/users/{admin_id}", response_model=AdminRead)
def update_user(
    admin_id: int,
    payload: AdminUpdate,
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    dao = AdminDAO(db)
    admin = dao.get_admin_by_id(admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    role = dao.get_role_by_id(payload.role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    password_hash = hash_password(payload.password) if payload.password else None

    dao.update_admin(
        admin,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        role_id=payload.role_id,
        is_active=payload.is_active,
        password_hash=password_hash,
    )
    db.commit()
    db.refresh(admin)
    return admin


@router.get("/roles", response_model=list[RoleRead])
def get_roles(
    db: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    dao = AdminDAO(db)
    return dao.list_roles()