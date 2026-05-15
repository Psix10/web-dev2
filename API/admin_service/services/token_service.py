from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt


class TokenService:
    def __init__(
        self,
        *,
        secret_key: str,
        algorithm: str,
        access_token_expire_minutes: int,
        refresh_token_expire_days: int,
    ):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days

    def create_access_token(self, payload: dict) -> str:
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=self.access_token_expire_minutes)

        to_encode = payload.copy()
        to_encode.update(
            {
                "iss": "admin_service",
                "aud": "internal_api",
                "type": "access",
                "token_type": "admin_access",
                "iat": now,
                "exp": expire,
            }
        )
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(self, admin_id: int) -> tuple[str, datetime]:
        now = datetime.now(timezone.utc)
        expire = now + timedelta(days=self.refresh_token_expire_days)

        payload = {
            "sub": str(admin_id),
            "iss": "admin_service",
            "type": "refresh",
            "token_type": "admin_refresh",
            "iat": now,
            "exp": expire,
        }
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return token, expire

    def decode_token(self, token: str) -> dict:
        try:
            return jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={"verify_aud": False},
            )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

    def require_token_type(self, payload: dict, token_type: str) -> None:
        actual_type = payload.get("type")
        if actual_type != token_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token type: expected {token_type}",
            )