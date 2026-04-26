import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext


SECRET_KEY = os.getenv("JWT_SECRET_KEY", "DEV_ONLY_CHANGE_ME")
ALGORITHM = "HS256"

ISSUER = "auth_service"
ACCESS_AUDIENCE = "internal_api"

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "access",
        "iss": ISSUER,
        "aud": ACCESS_AUDIENCE,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int) -> tuple[str, datetime]:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    token = secrets.token_urlsafe(64)

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": token,
        "iss": ISSUER,
        "exp": expire,
    }
    refresh_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return refresh_token, expire


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def decode_token(token: str, audience: str | None = None) -> dict:
    options = {"verify_aud": audience is not None}
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        issuer=ISSUER,
        audience=audience,
        options=options,
    )


def now_utc() -> datetime:
    return datetime.now(timezone.utc)