from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from core.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8004/api/auth/login")


async def get_current_token_payload(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise credentials_exception

    if payload.get("type") != "access":
        raise credentials_exception

    if not payload.get("sub"):
        raise credentials_exception

    return payload


async def get_current_user_id(payload: dict = Depends(get_current_token_payload)) -> int:
    try:
        return int(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_email(payload: dict = Depends(get_current_token_payload)) -> str:
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email claim is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return email