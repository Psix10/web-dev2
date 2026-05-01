from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status

from schemas.admin_schemas import TokenResponse


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class AuthService:
    def __init__(self, dao, token_service, password_service):
        self.dao = dao
        self.token_service = token_service
        self.password_service = password_service

    async def login(self, email: str, password: str) -> TokenResponse:
        admin = await self.dao.get_admin_by_email(email)
        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not self.password_service.verify(password, admin.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin is inactive",
            )

        permissions = sorted({permission.code for permission in admin.role.permissions})

        access_payload = {
            "sub": str(admin.id),
            "email": admin.email,
            "role": admin.role.name,
            "permissions": permissions,
            "principal_type": "admin",
        }

        access_token = self.token_service.create_access_token(access_payload)
        refresh_token, refresh_expires_at = self.token_service.create_refresh_token(admin.id)

        await self.dao.create_session(
            admin_id=admin.id,
            refresh_token_hash=self.password_service.hash_token(refresh_token),
            expires_at=refresh_expires_at,
        )

        await self.dao.session.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = self.token_service.decode_token(refresh_token)
        self.token_service.require_token_type(payload, "refresh")

        admin_id_raw = payload.get("sub")
        if admin_id_raw is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload",
            )

        try:
            admin_id = int(admin_id_raw)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token subject",
            )

        refresh_token_hash = self.password_service.hash_token(refresh_token)
        session_obj = await self.dao.get_active_session_by_refresh_hash(refresh_token_hash)
        if session_obj is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh session not found",
            )

        if session_obj.expires_at < now_utc():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        admin = await self.dao.get_admin_by_id(admin_id)
        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin not found",
            )

        if not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin is inactive",
            )

        permissions = sorted({permission.code for permission in admin.role.permissions})

        access_payload = {
            "sub": str(admin.id),
            "email": admin.email,
            "role": admin.role.name,
            "permissions": permissions,
            "principal_type": "admin",
        }

        await self.dao.revoke_session(session_obj.id, now_utc())

        new_access_token = self.token_service.create_access_token(access_payload)
        new_refresh_token, new_refresh_expires_at = self.token_service.create_refresh_token(admin.id)

        await self.dao.create_session(
            admin_id=admin.id,
            refresh_token_hash=self.password_service.hash_token(new_refresh_token),
            expires_at=new_refresh_expires_at,
        )

        await self.dao.session.commit()

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )

    async def logout(self, refresh_token: str) -> None:
        payload = self.token_service.decode_token(refresh_token)
        self.token_service.require_token_type(payload, "refresh")

        refresh_token_hash = self.password_service.hash_token(refresh_token)
        session_obj = await self.dao.get_active_session_by_refresh_hash(refresh_token_hash)
        if session_obj is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh session not found",
            )

        await self.dao.revoke_session(session_obj.id, now_utc())
        await self.dao.session.commit()