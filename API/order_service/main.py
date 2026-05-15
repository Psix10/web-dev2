from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db.db import Base, engine
from api.cart_router import cart_router
from api.user_orders_router import user_router
from api.user_address_router import router as address_router
from api.admin_orders_router import admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Orders Service", lifespan=lifespan)

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

app.include_router(cart_router)
app.include_router(user_router)
app.include_router(address_router)
app.include_router(admin_router)

@app.get("/health")
def health():
    return {"status": "ok"}