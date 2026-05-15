from fastapi import HTTPException, status
from jose import JWTError

from .rbac import get_permissions_for_role
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


USER_ROLE = "user"
USER_ACCESS_TOKEN_TYPE = "user_access"


class AuthService:
    def __init__(self, dao: AuthDAO):
        self.dao = dao

    def _build_user_access_claims(self, user) -> dict:
        return {
            "email": user.email,
            "role": USER_ROLE,
            "permissions": get_permissions_for_role(USER_ROLE),
            "token_type": USER_ACCESS_TOKEN_TYPE,
        }

    def _create_user_access_token(self, user) -> str:
        claims = self._build_user_access_claims(user)
        return create_access_token(
            subject=str(user.id),
            claims=claims,
        )

    async def register_user(
        self,
        payload: UserCreate,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ):
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

        access_token = self._create_user_access_token(user)
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

    async def login_user(
        self,
        payload: UserLogin,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ):
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

        access_token = self._create_user_access_token(user)
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
        refresh_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise refresh_exc

        if payload.get("type") != "refresh":
            raise refresh_exc

        token_hash = hash_token(refresh_token)
        session = await self.dao.get_active_session_by_refresh_token_hash(token_hash)

        if not session:
            raise refresh_exc

        if session.expires_at < now_utc():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = await self.dao.get_user_by_id(session.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is inactive",
            )

        await self.dao.revoke_session(session.id, now_utc())

        new_access_token = self._create_user_access_token(user)
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

    async def get_current_user_by_token(self, token: str):
        credentials_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = decode_token(token, audience=ACCESS_AUDIENCE)
        except JWTError:
            raise credentials_exc

        if payload.get("type") != "access":
            raise credentials_exc

        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exc

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise credentials_exc

        user = await self.dao.get_user_by_id(user_id)
        if not user:
            raise credentials_exc

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )

        return user

    async def logout(self, refresh_token: str):
        credentials_exc = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise credentials_exc

        if payload.get("type") != "refresh":
            raise credentials_exc

        token_hash = hash_token(refresh_token)
        session = await self.dao.get_active_session_by_refresh_token_hash(token_hash)
        if not session:
            raise credentials_exc

        await self.dao.revoke_session(session.id, now_utc())

        return {"message": "Logged out successfully"}

    async def update_user_profile(self, user_id: int, payload):
        user = await self.dao.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        updated_user = await self.dao.update_user(
            user_id=user_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,
        )

        return updated_user