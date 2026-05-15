from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers.proxy import router as proxy_router


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def healthcheck():
    return {"status": "ok", "service": settings.APP_NAME}


app.include_router(proxy_router)