import os

from jose import jwt


SECRET_KEY = os.getenv("JWT_SECRET_KEY", "DEV_ONLY_CHANGE_ME")
ALGORITHM = "HS256"

ISSUER = "auth_service"
ACCESS_AUDIENCE = "internal_api"


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        issuer=ISSUER,
        audience=ACCESS_AUDIENCE,
    )