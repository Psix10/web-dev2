from fastapi import HTTPException, status
from jose import JWTError

from dao.auth_dao import AuthDAO
from schemas.auth_schemas import UserCreate, UserLogin
from api.auth_utils import (
    ACCESS_AUDIENCE,
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    decode_token,
    now_utc,
)


class AuthService:
    def __init__(self, dao: AuthDAO):
        self.dao = dao

    async def register_user(self, payload: UserCreate, user_agent: str | None = None, ip_address: str | None = None):
        existing_user = await self.dao.get_user_by_email(payload.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

        password_hash = hash_password(payload.password)

        user = await self.dao.create_user(
            email=payload.email,
            password_hash=password_hash,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
        )

        access_token = create_access_token(user.id, user.email)
        refresh_token, refresh_expires_at = create_refresh_token(user.id)

        await self.dao.create_session(
            user_id=user.id,
            refresh_token_hash=hash_token(refresh_token),
            expires_at=refresh_expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        return {
            "user": user,
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            },
        }

    async def login_user(self, payload: UserLogin, user_agent: str | None = None, ip_address: str | None = None):
        user = await self.dao.get_user_by_email(payload.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is inactive",
            )

        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(user.id, user.email)
        refresh_token, refresh_expires_at = create_refresh_token(user.id)

        await self.dao.create_session(
            user_id=user.id,
            refresh_token_hash=hash_token(refresh_token),
            expires_at=refresh_expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        return {
            "user": user,
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            },
        }

    async def refresh_tokens(self, refresh_token: str):
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        token_hash = hash_token(refresh_token)
        session = await self.dao.get_active_session_by_refresh_token_hash(token_hash)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        if session.expires_at < now_utc():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
            )

        user = await self.dao.get_user_by_id(session.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        await self.dao.revoke_session(session.id, now_utc())

        new_access_token = create_access_token(user.id, user.email)
        new_refresh_token, new_refresh_expires_at = create_refresh_token(user.id)

        await self.dao.create_session(
            user_id=user.id,
            refresh_token_hash=hash_token(new_refresh_token),
            expires_at=new_refresh_expires_at,
            user_agent=session.user_agent,
            ip_address=session.ip_address,
        )

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    async def logout(self, refresh_token: str):
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        token_hash = hash_token(refresh_token)
        session = await self.dao.get_active_session_by_refresh_token_hash(token_hash)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        await self.dao.revoke_session(session.id, now_utc())
        return {"message": "Logged out successfully"}

    async def get_current_user_by_token(self, access_token: str):
        try:
            payload = decode_token(access_token, audience=ACCESS_AUDIENCE)
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid access token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = await self.dao.get_user_by_id(int(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user