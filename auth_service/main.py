from fastapi import FastAPI

from api.auth_api import router as auth_router
from db.db import init_models


app = FastAPI(title="Auth Service")

app.include_router(auth_router)


@app.on_event("startup")
async def on_startup():
    await init_models()


@app.get("/health")
def health():
    return {"status": "ok"}