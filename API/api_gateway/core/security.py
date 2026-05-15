from fastapi import HTTPException, Request, status
from jose import JWTError, jwt

from core.config import settings


PUBLIC_PATHS = {
    "/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/logout",
    "/api/admin/auth/login",
    "/api/admin/auth/refresh",
    "/api/admin/auth/logout",
}

PUBLIC_PREFIXES = {
    "/api/products",
    "/api/categories",
}


def is_public_path(path: str, method: str) -> bool:
    if path in PUBLIC_PATHS:
        return True

    if method.upper() in {"GET", "OPTIONS"} and any(
        path.startswith(prefix) for prefix in PUBLIC_PREFIXES
    ):
        return True

    return False


def extract_bearer_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    parts = auth_header.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1].strip()


def get_unverified_claims(token: str) -> dict:
    try:
        return jwt.get_unverified_claims(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token structure",
        ) from exc


def resolve_secret_and_issuer(payload: dict) -> tuple[str, str]:
    issuer = payload.get("iss")
    token_type = payload.get("token_type")

    if issuer == "admin_service" or token_type == "admin_access":
        return settings.ADMIN_JWT_SECRET_KEY, "admin_service"

    if issuer == "auth_service" or token_type == "user_access":
        return settings.USER_JWT_SECRET_KEY, "auth_service"

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unknown token issuer",
    )


def decode_access_token(token: str) -> dict:
    unverified_payload = get_unverified_claims(token)
    secret, expected_issuer = resolve_secret_and_issuer(unverified_payload)

    try:
        return jwt.decode(
            token,
            secret,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=expected_issuer,
            audience="internal_api"
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def is_public_products_read(request: Request) -> bool:
    path = request.url.path
    method = request.method.upper()

    if path.startswith("/api/products") and method in {"GET", "OPTIONS"}:
        return True

    return False


def authorize_request(path: str, method: str, auth_context: dict | None) -> None:
    if path.startswith("/api/auth"):
        if auth_context is None:
            raise HTTPException(status_code=401, detail="Authentication required")
        if auth_context.get("issuer") != "auth_service":
            raise HTTPException(status_code=403, detail="Only user tokens are allowed for this route")
        return

    if path.startswith("/api/admin"):
        if auth_context is None:
            raise HTTPException(status_code=401, detail="Authentication required")
        if auth_context.get("issuer") != "admin_service":
            raise HTTPException(status_code=403, detail="Only admin tokens are allowed for this route")
        return

    if path.startswith("/api/orders") or path.startswith("/api/cart") or path.startswith("/api/users/me/addresses"):
        if auth_context is None:
            raise HTTPException(status_code=401, detail="Authentication required")
        return


def get_auth_context(request: Request) -> dict | None:
    path = request.url.path
    method = request.method.upper()

    if is_public_path(path, method):
        return None

    token = extract_bearer_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is missing",
        )

    payload = decode_access_token(token)

    permissions = payload.get("permissions", [])
    if not isinstance(permissions, list):
        permissions = []

    auth_context = {
        "token": token,
        "user_id": str(payload.get("sub", "")),
        "role": payload.get("role"),
        "permissions": permissions,
        "issuer": payload.get("iss"),
        "token_type": payload.get("token_type"),
        "payload": payload,
    }

    authorize_request(path, method, auth_context)
    return auth_context