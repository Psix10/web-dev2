from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import os


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False,
)

admin_bearer = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

USER_ISSUER = "auth_service"
ADMIN_ISSUER = "admin_service"
ACCESS_AUDIENCE = "internal_api"


def decode_token(token: str, issuer: str, audience: str | None = None) -> dict:
    options = {"verify_aud": audience is not None}
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        issuer=issuer,
        audience=audience,
        options=options,
    )


async def optional_current_user(
    token: str | None = Depends(optional_oauth2_scheme),
):
    if token is None:
        return None

    try:
        payload = decode_token(token, issuer=USER_ISSUER, audience=ACCESS_AUDIENCE)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
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

    return {
        "id": int(user_id),
        "email": payload.get("email"),
    }


async def current_user(user=Depends(optional_current_user)):
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(admin_bearer),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = decode_token(token, issuer=ADMIN_ISSUER, audience=ACCESS_AUDIENCE)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("principal_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("token_type") != "admin_access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin_id = payload.get("sub")
    if not admin_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id": int(admin_id),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "permissions": payload.get("permissions", []),
    }

