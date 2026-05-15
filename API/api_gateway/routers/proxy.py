from fastapi import APIRouter, Request

from core.security import get_auth_context
from services.proxy_service import forward_request


router = APIRouter()


@router.api_route(
    "/api/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)
async def proxy_all(request: Request, full_path: str):
    path = f"/api/{full_path}"
    auth_context = get_auth_context(request)
    return await forward_request(request, path, auth_context)