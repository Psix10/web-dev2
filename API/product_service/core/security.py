import os
from fastapi import HTTPException, status
from jose import JWTError, jwt


ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_AUDIENCE = "internal_api"

USER_JWT_SECRET_KEY = os.getenv("USER_JWT_SECRET_KEY", "DEV_ONLY_CHANGE_ME")
ADMIN_JWT_SECRET_KEY = os.getenv("ADMIN_JWT_SECRET_KEY", "DEV_ONLY_CHANGE_ME")


def get_unverified_payload(token: str) -> dict:
    try:
        return jwt.get_unverified_claims(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc


def decode_access_token(token: str) -> dict:
    unverified = get_unverified_payload(token)
    issuer = unverified.get("iss")

    if issuer == "auth_service":
        secret = USER_JWT_SECRET_KEY
    elif issuer == "admin_service":
        secret = ADMIN_JWT_SECRET_KEY
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown token issuer",
        )

    try:
        return jwt.decode(
            token,
            secret,
            algorithms=[ALGORITHM],
            issuer=issuer,
            audience=ACCESS_AUDIENCE,
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc