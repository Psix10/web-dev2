from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth_api import router as auth_router
from db.db import init_models


app = FastAPI(title="Auth Service")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(auth_router)


@app.on_event("startup")
async def on_startup():
    await init_models()


@app.get("/health")
def health():
    return {"status": "ok"}