import httpx
from fastapi import HTTPException, Request, status
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask

from core.config import settings


SERVICE_MAP = {
    # Product Service - admin routes (более специфичные идут первыми)
    "/api/admin/products": settings.PRODUCT_SERVICE_URL,
    "/api/admin/categories": settings.PRODUCT_SERVICE_URL,
    
    # Product Service - public routes
    "/api/products": settings.PRODUCT_SERVICE_URL,
    "/api/categories": settings.PRODUCT_SERVICE_URL,

    # Order Service - admin routes
    "/api/admin/orders": settings.ORDER_SERVICE_URL,
    
    # Order Service - user routes
    "/api/cart": settings.ORDER_SERVICE_URL,
    "/api/orders": settings.ORDER_SERVICE_URL,
    "/api/users/me/addresses": settings.ORDER_SERVICE_URL,

    # Admin Service - более специфичные admin auth routes
    "/api/admin/auth": settings.ADMIN_SERVICE_URL,
    "/api/admin/users": settings.ADMIN_SERVICE_URL,
    "/api/admin/roles": settings.ADMIN_SERVICE_URL,
    "/api/admin/permissions": settings.ADMIN_SERVICE_URL,
    "/api/admin/me": settings.ADMIN_SERVICE_URL,

    # Auth Service
    "/api/auth": settings.AUTH_SERVICE_URL,
}

def resolve_service(path: str) -> str:
    matched_prefix = None
    matched_target = None

    for prefix, target in SERVICE_MAP.items():
        if path.startswith(prefix):
            if matched_prefix is None or len(prefix) > len(matched_prefix):
                matched_prefix = prefix
                matched_target = target

    if matched_target:
        return matched_target

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Route not found",
    )


def build_forward_headers(request: Request, auth_context: dict | None) -> list[tuple[bytes, bytes]]:
    headers = []

    for key, value in request.headers.raw:
        if key.lower() in {b"host", b"content-length"}:
            continue
        headers.append((key, value))

    if auth_context:
        headers.append((b"x-user-id", auth_context["user_id"].encode()))
        headers.append((b"x-user-role", str(auth_context.get("role") or "").encode()))
        headers.append(
            (b"x-user-permissions", ",".join(auth_context.get("permissions", [])).encode())
        )
        headers.append(
            (b"x-token-issuer", str(auth_context.get("issuer") or "").encode())
        )
        headers.append(
            (b"x-token-type", str(auth_context.get("token_type") or "").encode())
        )

    return headers


async def forward_request(
    request: Request,
    path: str,
    auth_context: dict | None,
) -> StreamingResponse:
    target_base = resolve_service(path)

    url = httpx.URL(
        path=path,
        query=request.url.query.encode("utf-8"),
    )

    headers = build_forward_headers(request, auth_context)

    try:
        async with httpx.AsyncClient(
            base_url=target_base,
            timeout=settings.GATEWAY_TIMEOUT,
        ) as client:
            upstream_request = client.build_request(
                method=request.method,
                url=url,
                headers=headers,
                content=await request.body(),
            )

            upstream_response = await client.send(upstream_request, stream=True)

            excluded_headers = {
                "content-encoding",
                "transfer-encoding",
                "connection",
            }

            response_headers = {
                key: value
                for key, value in upstream_response.headers.items()
                if key.lower() not in excluded_headers
            }

            return StreamingResponse(
                upstream_response.aiter_raw(),
                status_code=upstream_response.status_code,
                headers=response_headers,
                background=BackgroundTask(upstream_response.aclose),
            )

    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream service unavailable: {exc}",
        ) from exc